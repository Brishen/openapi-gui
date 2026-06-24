/**
 * parse: JSON Schema (2020-12) -> editor model.
 *
 * The inverse of `compile`, used to load an existing schema into the editor.
 * Recognized keywords are mapped onto the model; `$ref`/`$defs` are resolved;
 * anything we don't model is recorded in `unsupported` so the UI can warn rather
 * than silently drop it.
 */

import type { JsonPrimitive, JsonSchema, JsonSchemaType } from './json-schema';
import type { ObjectProperty, SchemaNode, StringFormat } from './model';
import {
  arrayNode,
  booleanNode,
  constNode,
  enumNode,
  integerNode,
  numberNode,
  objectNode,
  stringNode,
  unionNode,
} from './model';

export interface ParseResult {
  node: SchemaNode;
  /** Keywords / shapes encountered that the model does not represent. */
  unsupported: string[];
}

interface ParseCtx {
  defs: Record<string, JsonSchema>;
  unsupported: Set<string>;
  /** Guards against infinite recursion on self-referential $refs. */
  refStack: Set<string>;
}

/** Shared node metadata pulled off a schema and threaded into the factories. */
type Meta = { title?: string; description?: string; examples?: JsonPrimitive[] };
type Base = Meta & { nullable?: boolean };

/** Keywords we knowingly map; everything else gets reported as unsupported. */
const KNOWN_KEYWORDS = new Set([
  '$schema',
  '$ref',
  '$defs',
  'type',
  'title',
  'description',
  'examples',
  'anyOf',
  'enum',
  'const',
  'minLength',
  'maxLength',
  'pattern',
  'format',
  'minimum',
  'maximum',
  'multipleOf',
  'properties',
  'required',
  'additionalProperties',
  'items',
  'minItems',
  'maxItems',
  'uniqueItems',
]);

const STRING_FORMATS: ReadonlySet<string> = new Set<StringFormat>([
  'date-time',
  'date',
  'time',
  'duration',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'uri',
  'uuid',
]);

export function parse(schema: JsonSchema): ParseResult {
  const ctx: ParseCtx = {
    defs: schema.$defs ?? {},
    unsupported: new Set(),
    refStack: new Set(),
  };
  const node = parseNode(schema, ctx);
  return { node, unsupported: [...ctx.unsupported] };
}

function reportUnknownKeywords(schema: JsonSchema, ctx: ParseCtx): void {
  for (const key of Object.keys(schema)) {
    if (!KNOWN_KEYWORDS.has(key)) ctx.unsupported.add(key);
  }
}

function resolveRef(ref: string, ctx: ParseCtx): JsonSchema | undefined {
  const match = /^#\/\$defs\/(.+)$/.exec(ref);
  if (!match) {
    ctx.unsupported.add(`$ref:${ref}`);
    return undefined;
  }
  const target = ctx.defs[match[1]];
  if (!target) ctx.unsupported.add(`$ref:${ref}`);
  return target;
}

/** Detect node-level nullability from `type: [...]` or an anyOf null branch. */
function extractNullable(schema: JsonSchema): { nullable: boolean; type?: JsonSchemaType } {
  if (Array.isArray(schema.type)) {
    const nonNull = schema.type.filter((t) => t !== 'null');
    return { nullable: schema.type.includes('null'), type: nonNull[0] };
  }
  return { nullable: false, type: schema.type };
}

function parseNode(schema: JsonSchema, ctx: ParseCtx): SchemaNode {
  if (schema.$ref) {
    if (ctx.refStack.has(schema.$ref)) {
      // Recursive ref — we can't model it; emit a placeholder string node.
      ctx.unsupported.add(`recursive $ref:${schema.$ref}`);
      return stringNode({ description: `unresolved ref ${schema.$ref}` });
    }
    const target = resolveRef(schema.$ref, ctx);
    if (target) {
      ctx.refStack.add(schema.$ref);
      const result = parseNode(target, ctx);
      ctx.refStack.delete(schema.$ref);
      return result;
    }
    return stringNode({ description: `unresolved ref ${schema.$ref}` });
  }

  reportUnknownKeywords(schema, ctx);

  const meta = {
    title: schema.title,
    description: schema.description,
    examples: schema.examples && schema.examples.length > 0 ? schema.examples : undefined,
  };

  // anyOf -> union (unless it is purely a "T | null" widening)
  if (schema.anyOf) {
    return parseAnyOf(schema, ctx, meta);
  }

  if (schema.const !== undefined) {
    return constNode(schema.const, meta);
  }

  if (schema.enum && schema.enum.length > 0) {
    return enumNode([...schema.enum], meta);
  }

  const { nullable, type } = extractNullable(schema);
  const base = { ...meta, nullable: nullable || undefined };

  switch (type) {
    case 'string':
      return parseString(schema, base);
    case 'number':
      return numberNode({ ...base, ...numberConstraints(schema) });
    case 'integer':
      return integerNode({ ...base, ...numberConstraints(schema) });
    case 'boolean':
      return booleanNode(base);
    case 'object':
      return parseObject(schema, ctx, base);
    case 'array':
      return parseArray(schema, ctx, base);
    default:
      // No usable type — record and fall back to a string node.
      ctx.unsupported.add('schema with no recognized type');
      return stringNode(base);
  }
}

function parseAnyOf(
  schema: JsonSchema,
  ctx: ParseCtx,
  meta: Meta,
): SchemaNode {
  const branches = schema.anyOf ?? [];
  const nullBranches = branches.filter((b) => b.type === 'null');
  const realBranches = branches.filter((b) => b.type !== 'null');
  const nullable = nullBranches.length > 0;

  if (realBranches.length === 1) {
    // "T | null" widening — collapse to a single nullable node.
    const inner = parseNode(realBranches[0], ctx);
    return { ...inner, nullable: nullable || inner.nullable, ...stripUndefined(meta) };
  }

  return unionNode(realBranches.map((b) => parseNode(b, ctx)), {
    ...meta,
    nullable: nullable || undefined,
  });
}

function parseString(
  schema: JsonSchema,
  base: Base,
) {
  const format =
    schema.format && STRING_FORMATS.has(schema.format)
      ? (schema.format as StringFormat)
      : undefined;
  return stringNode({
    ...base,
    enum: stringEnum(schema),
    pattern: schema.pattern,
    format,
    minLength: schema.minLength,
    maxLength: schema.maxLength,
  });
}

function stringEnum(schema: JsonSchema): string[] | undefined {
  if (!schema.enum) return undefined;
  const strings = schema.enum.filter((v): v is string => typeof v === 'string');
  return strings.length === schema.enum.length && strings.length > 0 ? strings : undefined;
}

function numberConstraints(schema: JsonSchema) {
  return {
    minimum: schema.minimum,
    maximum: schema.maximum,
    multipleOf: schema.multipleOf,
    enum: numberEnum(schema),
  };
}

function numberEnum(schema: JsonSchema): number[] | undefined {
  if (!schema.enum) return undefined;
  const nums = schema.enum.filter((v): v is number => typeof v === 'number');
  return nums.length === schema.enum.length && nums.length > 0 ? nums : undefined;
}

function parseObject(
  schema: JsonSchema,
  ctx: ParseCtx,
  base: Base,
) {
  const required = new Set(schema.required ?? []);
  // Null-widening is always read as `nullable`; `required` membership is read as
  // required. This makes the portable round-trip lossless. The strict profile's
  // optional-encoding ("key in required" + a null branch) is inherently
  // ambiguous with a genuinely required-nullable property, so a strict-compiled
  // optional field round-trips as required-nullable (a documented lossy case).
  const properties: ObjectProperty[] = Object.entries(schema.properties ?? {}).map(
    ([key, propSchema]) => ({
      key,
      required: required.has(key),
      node: parseNode(propSchema, ctx),
    }),
  );

  const additionalProperties =
    typeof schema.additionalProperties === 'boolean' ? schema.additionalProperties : false;

  return objectNode({ ...base, properties, additionalProperties });
}

function parseArray(
  schema: JsonSchema,
  ctx: ParseCtx,
  base: Base,
) {
  const items = schema.items ? parseNode(schema.items, ctx) : stringNode();
  if (!schema.items) ctx.unsupported.add('array without items');
  return arrayNode(items, {
    ...base,
    minItems: schema.minItems,
    maxItems: schema.maxItems,
    uniqueItems: schema.uniqueItems,
  });
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}
