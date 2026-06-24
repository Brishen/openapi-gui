/**
 * Reducer + actions for the schema editor. The state is a single root
 * SchemaNode; all mutations are addressed by node id and applied immutably so
 * React can diff by reference. The reducer never compiles — `useSchemaBuilder`
 * derives the JSON Schema and lint issues from the model with useMemo.
 */

import type { NodeKind, ObjectNode, SchemaNode, StringFormat } from '../core';
import {
  arrayNode,
  booleanNode,
  constNode,
  enumNode,
  integerNode,
  makeId,
  numberNode,
  objectNode,
  stringNode,
  unionNode,
} from '../core';

/** Constraint fields that can be patched on a node (kind-specific). */
export type NodePatch = Partial<{
  title: string;
  description: string;
  nullable: boolean;
  // string
  pattern: string;
  format: StringFormat | undefined;
  minLength: number;
  maxLength: number;
  // number / integer
  minimum: number;
  maximum: number;
  multipleOf: number;
  // array
  minItems: number;
  maxItems: number;
  uniqueItems: boolean;
  // object
  additionalProperties: boolean;
}>;

export type Action =
  | { type: 'import'; node: SchemaNode }
  | { type: 'patchNode'; id: string; patch: NodePatch }
  | { type: 'changeKind'; id: string; kind: NodeKind }
  | { type: 'setEnumValues'; id: string; values: (string | number)[] }
  | { type: 'setConstValue'; id: string; value: string | number | boolean | null }
  | { type: 'addProperty'; objectId: string }
  | { type: 'removeProperty'; objectId: string; index: number }
  | { type: 'renameProperty'; objectId: string; index: number; key: string }
  | { type: 'toggleRequired'; objectId: string; index: number }
  | { type: 'reorderProperty'; objectId: string; from: number; to: number }
  | { type: 'addUnionOption'; unionId: string }
  | { type: 'removeUnionOption'; unionId: string; index: number };

export function reducer(state: SchemaNode, action: Action): SchemaNode {
  switch (action.type) {
    case 'import':
      return action.node;

    case 'patchNode':
      return mapNode(state, action.id, (node) => applyPatch(node, action.patch));

    case 'changeKind':
      return mapNode(state, action.id, (node) => convertKind(node, action.kind));

    case 'setEnumValues':
      return mapNode(state, action.id, (node) =>
        node.kind === 'enum' ? { ...node, values: action.values } : node,
      );

    case 'setConstValue':
      return mapNode(state, action.id, (node) =>
        node.kind === 'const' ? { ...node, value: action.value } : node,
      );

    case 'addProperty':
      return mapObject(state, action.objectId, (obj) => ({
        ...obj,
        properties: [
          ...obj.properties,
          { key: uniqueKey(obj), required: true, node: stringNode() },
        ],
      }));

    case 'removeProperty':
      return mapObject(state, action.objectId, (obj) => ({
        ...obj,
        properties: obj.properties.filter((_, i) => i !== action.index),
      }));

    case 'renameProperty':
      return mapObject(state, action.objectId, (obj) => ({
        ...obj,
        properties: obj.properties.map((p, i) =>
          i === action.index ? { ...p, key: action.key } : p,
        ),
      }));

    case 'toggleRequired':
      return mapObject(state, action.objectId, (obj) => ({
        ...obj,
        properties: obj.properties.map((p, i) =>
          i === action.index ? { ...p, required: !p.required } : p,
        ),
      }));

    case 'reorderProperty':
      return mapObject(state, action.objectId, (obj) => ({
        ...obj,
        properties: reorder(obj.properties, action.from, action.to),
      }));

    case 'addUnionOption':
      return mapNode(state, action.unionId, (node) =>
        node.kind === 'union' ? { ...node, options: [...node.options, stringNode()] } : node,
      );

    case 'removeUnionOption':
      return mapNode(state, action.unionId, (node) =>
        node.kind === 'union'
          ? { ...node, options: node.options.filter((_, i) => i !== action.index) }
          : node,
      );
  }
}

// --- tree traversal --------------------------------------------------------

/** Apply `fn` to the node with `id`, rebuilding only the path to it. */
function mapNode(node: SchemaNode, id: string, fn: (n: SchemaNode) => SchemaNode): SchemaNode {
  if (node.id === id) return fn(node);

  switch (node.kind) {
    case 'object': {
      let changed = false;
      const properties = node.properties.map((p) => {
        const next = mapNode(p.node, id, fn);
        if (next !== p.node) changed = true;
        return next === p.node ? p : { ...p, node: next };
      });
      return changed ? { ...node, properties } : node;
    }
    case 'array': {
      const items = mapNode(node.items, id, fn);
      return items === node.items ? node : { ...node, items };
    }
    case 'union': {
      let changed = false;
      const options = node.options.map((o) => {
        const next = mapNode(o, id, fn);
        if (next !== o) changed = true;
        return next;
      });
      return changed ? { ...node, options } : node;
    }
    default:
      return node;
  }
}

/** Like mapNode but typed for object-only operations. */
function mapObject(node: SchemaNode, id: string, fn: (o: ObjectNode) => ObjectNode): SchemaNode {
  return mapNode(node, id, (n) => (n.kind === 'object' ? fn(n) : n));
}

// --- helpers ---------------------------------------------------------------

function applyPatch(node: SchemaNode, patch: NodePatch): SchemaNode {
  const next: Record<string, unknown> = { ...node };
  for (const [key, value] of Object.entries(patch)) {
    // Empty string / NaN clears the field.
    if (value === '' || (typeof value === 'number' && Number.isNaN(value)) || value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }
  return next as unknown as SchemaNode;
}

/** Convert a node to a different kind, preserving id + shared metadata. */
function convertKind(node: SchemaNode, kind: NodeKind): SchemaNode {
  if (node.kind === kind) return node;
  const meta = { title: node.title, description: node.description, nullable: node.nullable };
  let next: SchemaNode;
  switch (kind) {
    case 'string':
      next = stringNode(meta);
      break;
    case 'number':
      next = numberNode(meta);
      break;
    case 'integer':
      next = integerNode(meta);
      break;
    case 'boolean':
      next = booleanNode(meta);
      break;
    case 'object':
      next = objectNode(meta);
      break;
    case 'array':
      next = arrayNode(stringNode(), meta);
      break;
    case 'enum':
      next = enumNode([], meta);
      break;
    case 'const':
      next = constNode('', meta);
      break;
    case 'union':
      next = unionNode([stringNode()], meta);
      break;
  }
  return { ...next, id: node.id };
}

function uniqueKey(obj: ObjectNode): string {
  const existing = new Set(obj.properties.map((p) => p.key));
  let i = 1;
  let key = 'field';
  while (existing.has(key)) key = `field${++i}`;
  return key;
}

function reorder<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const copy = [...list];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

/** Default root model for an empty editor. */
export function emptyModel(): SchemaNode {
  return objectNode({ title: 'Response' });
}

// re-export makeId for callers building initial state
export { makeId };
