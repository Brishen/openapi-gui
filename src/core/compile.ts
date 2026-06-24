/**
 * compile: editor model -> JSON Schema (2020-12) + OpenAI response_format.
 *
 * Two profiles control how the schema is shaped for guided-decoding backends:
 *
 *  - `portable` (default): the broadly-supported subset. Optional properties are
 *    simply omitted from `required`; every object gets `additionalProperties:false`.
 *
 *  - `strict` (OpenAI strict=true): every property is listed in `required`, and
 *    optionality is expressed by widening the property's type to allow `null`
 *    (`["T","null"]`). `additionalProperties:false` is forced on every object.
 */

import type { JsonSchema, ResponseFormat } from './json-schema';
import type { ArrayNode, NumberNode, ObjectNode, SchemaNode, StringNode } from './model';

export type CompileProfile = 'portable' | 'strict';

export interface CompileOptions {
  profile?: CompileProfile;
  /** `name` for the response_format json_schema (defaults to "response"). */
  name?: string;
}

export interface CompileIssue {
  level: 'error' | 'warning';
  message: string;
  /** id of the offending node, when known. */
  nodeId?: string;
}

export interface CompileResult {
  schema: JsonSchema;
  responseFormat: ResponseFormat;
  issues: CompileIssue[];
}

const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** Wrap a finished JSON Schema in the OpenAI response_format envelope. */
export function buildResponseFormat(
  schema: JsonSchema,
  options: { name?: string; strict?: boolean } = {},
): ResponseFormat {
  const rawName = options.name ?? 'response';
  // OpenAI requires name to match ^[a-zA-Z0-9_-]+$; sanitize defensively.
  const name = NAME_PATTERN.test(rawName) ? rawName : rawName.replace(/[^a-zA-Z0-9_-]+/g, '_');
  return {
    type: 'json_schema',
    json_schema: {
      name: name || 'response',
      strict: options.strict ?? false,
      schema,
    },
  };
}

export function compile(node: SchemaNode, options: CompileOptions = {}): CompileResult {
  const profile = options.profile ?? 'portable';
  const strict = profile === 'strict';
  const issues: CompileIssue[] = [];

  const schema = compileNode(node, { profile, strict, issues });
  schema.$schema = 'https://json-schema.org/draft/2020-12/schema';

  const responseFormat = buildResponseFormat(schema, { name: options.name, strict });
  return { schema, responseFormat, issues };
}

interface Ctx {
  profile: CompileProfile;
  strict: boolean;
  issues: CompileIssue[];
}

function compileNode(node: SchemaNode, ctx: Ctx): JsonSchema {
  const schema = compileBody(node, ctx);
  attachMeta(node, schema);
  return applyNullable(node, schema);
}

/** title/description carry across unchanged. */
function attachMeta(node: SchemaNode, schema: JsonSchema): void {
  if (node.title) schema.title = node.title;
  if (node.description) schema.description = node.description;
}

/**
 * Node-level `nullable` widens the emitted type to include "null". For nodes
 * that express their type via `type`, we turn it into a `["T","null"]` array.
 * For typeless nodes (enum/const/union) we add a null option appropriately.
 */
function applyNullable(node: SchemaNode, schema: JsonSchema): JsonSchema {
  if (!node.nullable) return schema;
  return widenToNull(schema);
}

function widenToNull(schema: JsonSchema): JsonSchema {
  if (schema.anyOf) {
    const hasNull = schema.anyOf.some((s) => s.type === 'null');
    if (!hasNull) schema.anyOf = [...schema.anyOf, { type: 'null' }];
    return schema;
  }
  if (typeof schema.type === 'string') {
    schema.type = [schema.type, 'null'];
    return schema;
  }
  if (Array.isArray(schema.type)) {
    if (!schema.type.includes('null')) schema.type = [...schema.type, 'null'];
    return schema;
  }
  // enum / const without an explicit type: wrap in anyOf with a null branch.
  return { anyOf: [schema, { type: 'null' }] };
}

function compileBody(node: SchemaNode, ctx: Ctx): JsonSchema {
  switch (node.kind) {
    case 'string':
      return compileString(node);
    case 'number':
    case 'integer':
      return compileNumber(node);
    case 'boolean':
      return { type: 'boolean' };
    case 'object':
      return compileObject(node, ctx);
    case 'array':
      return compileArray(node, ctx);
    case 'enum':
      return { enum: [...node.values] };
    case 'const':
      return { const: node.value };
    case 'union':
      return { anyOf: node.options.map((opt) => compileNode(opt, ctx)) };
  }
}

function compileString(node: StringNode): JsonSchema {
  const schema: JsonSchema = { type: 'string' };
  if (node.enum && node.enum.length > 0) schema.enum = [...node.enum];
  if (node.pattern) schema.pattern = node.pattern;
  if (node.format) schema.format = node.format;
  if (node.minLength !== undefined) schema.minLength = node.minLength;
  if (node.maxLength !== undefined) schema.maxLength = node.maxLength;
  return schema;
}

function compileNumber(node: NumberNode): JsonSchema {
  const schema: JsonSchema = { type: node.kind };
  if (node.minimum !== undefined) schema.minimum = node.minimum;
  if (node.maximum !== undefined) schema.maximum = node.maximum;
  if (node.multipleOf !== undefined) schema.multipleOf = node.multipleOf;
  if (node.enum && node.enum.length > 0) schema.enum = [...node.enum];
  return schema;
}

function compileObject(node: ObjectNode, ctx: Ctx): JsonSchema {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  const seen = new Set<string>();

  for (const prop of node.properties) {
    if (!prop.key) {
      ctx.issues.push({
        level: 'error',
        message: 'Object property has an empty name.',
        nodeId: node.id,
      });
      continue;
    }
    if (seen.has(prop.key)) {
      ctx.issues.push({
        level: 'error',
        message: `Duplicate property name "${prop.key}".`,
        nodeId: node.id,
      });
      continue;
    }
    seen.add(prop.key);

    let propSchema = compileNode(prop.node, ctx);

    if (ctx.strict) {
      // Strict: every property listed in required; optional => allow null.
      required.push(prop.key);
      if (!prop.required) propSchema = widenToNull(propSchema);
    } else if (prop.required) {
      required.push(prop.key);
    }

    properties[prop.key] = propSchema;
  }

  const schema: JsonSchema = { type: 'object', properties };
  if (required.length > 0) schema.required = required;
  // Strict always forces false; portable defaults to the node's choice (false).
  schema.additionalProperties = ctx.strict ? false : node.additionalProperties;
  return schema;
}

function compileArray(node: ArrayNode, ctx: Ctx): JsonSchema {
  const schema: JsonSchema = { type: 'array', items: compileNode(node.items, ctx) };
  if (node.minItems !== undefined) schema.minItems = node.minItems;
  if (node.maxItems !== undefined) schema.maxItems = node.maxItems;
  if (node.uniqueItems) schema.uniqueItems = node.uniqueItems;
  return schema;
}
