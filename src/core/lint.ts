/**
 * lint: walk the editor model and surface issues against a chosen backend +
 * profile. Two flavors:
 *
 *  - compatibility: a keyword the target backend ignores or rejects (driven by
 *    `backends.ts`).
 *  - quality: nudges that make models follow the schema better (e.g. missing
 *    descriptions).
 */

import type { BackendId, TrackedKeyword } from './backends';
import { BACKEND_INFO, supportFor } from './backends';
import { compile } from './compile';
import type { CompileProfile } from './compile';
import type { ArrayNode, EnumNode, NumberNode, ObjectNode, SchemaNode, StringNode } from './model';
import { validateInstance } from './validate';

export interface Issue {
  level: 'error' | 'warning' | 'info';
  /** Stable category for filtering/testing. */
  rule: string;
  message: string;
  nodeId?: string;
  /** Dotted path to the node, for display (e.g. "address.zip"). */
  path: string;
}

export interface LintOptions {
  backend?: BackendId;
  profile?: CompileProfile;
}

export function lint(node: SchemaNode, options: LintOptions = {}): Issue[] {
  const issues: Issue[] = [];
  walk(node, '$', { backend: options.backend, issues });
  return issues;
}

interface LintCtx {
  backend?: BackendId;
  issues: Issue[];
}

function walk(node: SchemaNode, path: string, ctx: LintCtx): void {
  qualityChecks(node, path, ctx);

  switch (node.kind) {
    case 'string':
      stringChecks(node, path, ctx);
      break;
    case 'number':
    case 'integer':
      numberChecks(node, path, ctx);
      break;
    case 'object':
      objectChecks(node, path, ctx);
      break;
    case 'array':
      arrayChecks(node, path, ctx);
      break;
    case 'union':
      node.options.forEach((opt, i) => walk(opt, `${path}|${i}`, ctx));
      break;
    case 'boolean':
    case 'const':
      break;
    case 'enum':
      enumChecks(node, path, ctx);
      break;
  }
}

function qualityChecks(node: SchemaNode, path: string, ctx: LintCtx): void {
  // Descriptions meaningfully improve how well models fill a field.
  const describable = node.kind !== 'const' && node.kind !== 'boolean';
  if (describable && !node.description) {
    ctx.issues.push({
      level: 'info',
      rule: 'missing-description',
      message: 'No description — models follow described fields more reliably.',
      nodeId: node.id,
      path,
    });
  }

  // Examples should be valid against their own constraints.
  if (node.examples && node.examples.length > 0) {
    const { schema } = compile(node, { profile: 'portable' });
    for (const example of node.examples) {
      const res = validateInstance(schema, example);
      if (!res.valid) {
        const msg = res.errors.map((e) => e.message).join(', ');
        ctx.issues.push({
          level: 'error',
          rule: 'invalid-example',
          message: `Example "${example}" is invalid: ${msg}`,
          nodeId: node.id,
          path,
        });
      }
    }
  }
}

/** Emit a compatibility issue if the active backend doesn't honor a keyword. */
function backendCheck(
  keyword: TrackedKeyword,
  node: SchemaNode,
  path: string,
  ctx: LintCtx,
): void {
  if (!ctx.backend) return;
  const support = supportFor(keyword, ctx.backend);
  if (support === 'full') return;
  const label = BACKEND_INFO[ctx.backend].label;
  ctx.issues.push({
    level: support === 'unsupported' ? 'warning' : 'info',
    rule: support === 'unsupported' ? `unsupported-${keyword}` : `ignored-${keyword}`,
    message:
      support === 'unsupported'
        ? `${label} does not support "${keyword}" — it may be rejected or ignored.`
        : `${label} ignores "${keyword}" — it won't constrain output.`,
    nodeId: node.id,
    path,
  });
}

function stringChecks(node: StringNode, path: string, ctx: LintCtx): void {
  if (node.pattern) backendCheck('pattern', node, path, ctx);
  if (node.format) backendCheck('format', node, path, ctx);
  if (node.minLength !== undefined) backendCheck('minLength', node, path, ctx);
  if (node.maxLength !== undefined) backendCheck('maxLength', node, path, ctx);

  if (node.minLength !== undefined && node.minLength < 0) {
    ctx.issues.push({
      level: 'error',
      rule: 'invalid-minLength',
      message: 'Min length must be >= 0.',
      nodeId: node.id,
      path,
    });
  }
  if (node.maxLength !== undefined && node.maxLength <= 0) {
    ctx.issues.push({
      level: 'error',
      rule: 'invalid-maxLength',
      message: 'Max length must be greater than 0.',
      nodeId: node.id,
      path,
    });
  }
  if (
    node.minLength !== undefined &&
    node.maxLength !== undefined &&
    node.minLength > node.maxLength
  ) {
    ctx.issues.push({
      level: 'error',
      rule: 'invalid-length-range',
      message: 'Max length must be greater than or equal to min length.',
      nodeId: node.id,
      path,
    });
  }
}

function numberChecks(node: NumberNode, path: string, ctx: LintCtx): void {
  if (node.minimum !== undefined) backendCheck('minimum', node, path, ctx);
  if (node.maximum !== undefined) backendCheck('maximum', node, path, ctx);
  if (node.multipleOf !== undefined) {
    backendCheck('multipleOf', node, path, ctx);
    // multipleOf on non-integers is a common foot-gun even where supported.
    if (node.kind === 'number' && !Number.isInteger(node.multipleOf)) {
      ctx.issues.push({
        level: 'warning',
        rule: 'multipleOf-float',
        message: 'multipleOf with a fractional value is unreliable under guided decoding.',
        nodeId: node.id,
        path,
      });
    }
  }
}

function objectChecks(node: ObjectNode, path: string, ctx: LintCtx): void {
  if (node.properties.length === 0) {
    ctx.issues.push({
      level: 'warning',
      rule: 'empty-object',
      message: 'Object has no properties — it will only ever produce {}.',
      nodeId: node.id,
      path,
    });
  }
  for (const prop of node.properties) {
    walk(prop.node, path === '$' ? prop.key : `${path}.${prop.key}`, ctx);
  }
}

function arrayChecks(node: ArrayNode, path: string, ctx: LintCtx): void {
  if (node.minItems !== undefined) backendCheck('minItems', node, path, ctx);
  if (node.maxItems !== undefined) backendCheck('maxItems', node, path, ctx);
  if (node.uniqueItems) backendCheck('uniqueItems', node, path, ctx);
  walk(node.items, `${path}[]`, ctx);
}

function enumChecks(node: EnumNode, path: string, ctx: LintCtx): void {
  if (node.values.length === 0) {
    ctx.issues.push({
      level: 'error',
      rule: 'empty-enum',
      message: 'Enum has no values — it cannot be satisfied.',
      nodeId: node.id,
      path,
    });
  }
  const uniqueValues = new Set(node.values);
  if (uniqueValues.size < node.values.length) {
    ctx.issues.push({
      level: 'error',
      rule: 'duplicate-enum',
      message: 'Enum contains duplicate values.',
      nodeId: node.id,
      path,
    });
  }
}
