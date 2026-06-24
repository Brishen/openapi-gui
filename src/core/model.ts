/**
 * The editor model: an internal node tree that is the source of truth for the
 * UI. It is NOT JSON Schema — it carries stable ids, ordered object properties,
 * and per-node UI-friendly shapes. JSON Schema is produced from it by `compile`
 * and read into it by `parse`.
 */

import type { JsonPrimitive } from './json-schema';

export type StringFormat =
  | 'date-time'
  | 'date'
  | 'time'
  | 'duration'
  | 'email'
  | 'hostname'
  | 'ipv4'
  | 'ipv6'
  | 'uri'
  | 'uuid';

/** Fields shared by every node in the tree. */
export interface NodeBase {
  /** Stable identity for React keys + per-node UI state. */
  id: string;
  title?: string;
  description?: string;
  /** Example values emitted as the JSON Schema `examples` annotation. */
  examples?: JsonPrimitive[];
  /** When true, the compiled schema also permits `null` for this node. */
  nullable?: boolean;
}

export interface StringNode extends NodeBase {
  kind: 'string';
  enum?: string[];
  pattern?: string;
  format?: StringFormat;
  minLength?: number;
  maxLength?: number;
}

export interface NumberNode extends NodeBase {
  kind: 'number' | 'integer';
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  enum?: number[];
}

export interface BooleanNode extends NodeBase {
  kind: 'boolean';
}

/** One ordered property of an object. `required` is per-property. */
export interface ObjectProperty {
  key: string;
  required: boolean;
  node: SchemaNode;
}

export interface ObjectNode extends NodeBase {
  kind: 'object';
  properties: ObjectProperty[];
  /** Defaults to false. Strict profile always forces this false anyway. */
  additionalProperties: boolean;
}

export interface ArrayNode extends NodeBase {
  kind: 'array';
  items: SchemaNode;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}

/** A closed set of literal choices (strings or numbers). */
export interface EnumNode extends NodeBase {
  kind: 'enum';
  values: JsonPrimitive[];
}

/** A single fixed literal value. */
export interface ConstNode extends NodeBase {
  kind: 'const';
  value: JsonPrimitive;
}

/** anyOf composition — covers either-or shapes. */
export interface UnionNode extends NodeBase {
  kind: 'union';
  options: SchemaNode[];
}

export type SchemaNode =
  | StringNode
  | NumberNode
  | BooleanNode
  | ObjectNode
  | ArrayNode
  | EnumNode
  | ConstNode
  | UnionNode;

export type NodeKind = SchemaNode['kind'];

/** Generate a stable unique id. Uses crypto.randomUUID where available. */
export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID.
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// --- Factory helpers -------------------------------------------------------
// These keep the React layer dumb: it never builds raw node objects by hand.

export function stringNode(props: Partial<Omit<StringNode, 'kind' | 'id'>> = {}): StringNode {
  return { id: makeId(), kind: 'string', ...props };
}

export function numberNode(
  props: Partial<Omit<NumberNode, 'kind' | 'id'>> = {},
): NumberNode {
  return { id: makeId(), kind: 'number', ...props };
}

export function integerNode(
  props: Partial<Omit<NumberNode, 'kind' | 'id'>> = {},
): NumberNode {
  return { id: makeId(), kind: 'integer', ...props };
}

export function booleanNode(
  props: Partial<Omit<BooleanNode, 'kind' | 'id'>> = {},
): BooleanNode {
  return { id: makeId(), kind: 'boolean', ...props };
}

export function objectNode(
  props: Partial<Omit<ObjectNode, 'kind' | 'id' | 'properties' | 'additionalProperties'>> & {
    properties?: ObjectProperty[];
    additionalProperties?: boolean;
  } = {},
): ObjectNode {
  const { properties = [], additionalProperties = false, ...rest } = props;
  return { id: makeId(), kind: 'object', properties, additionalProperties, ...rest };
}

export function arrayNode(
  items: SchemaNode,
  props: Partial<Omit<ArrayNode, 'kind' | 'id' | 'items'>> = {},
): ArrayNode {
  return { id: makeId(), kind: 'array', items, ...props };
}

export function enumNode(
  values: JsonPrimitive[],
  props: Partial<Omit<EnumNode, 'kind' | 'id' | 'values'>> = {},
): EnumNode {
  return { id: makeId(), kind: 'enum', values, ...props };
}

export function constNode(
  value: JsonPrimitive,
  props: Partial<Omit<ConstNode, 'kind' | 'id' | 'value'>> = {},
): ConstNode {
  return { id: makeId(), kind: 'const', value, ...props };
}

export function unionNode(
  options: SchemaNode[],
  props: Partial<Omit<UnionNode, 'kind' | 'id' | 'options'>> = {},
): UnionNode {
  return { id: makeId(), kind: 'union', options, ...props };
}

/** Convenience: a property wrapper for object nodes. */
export function property(
  key: string,
  node: SchemaNode,
  required = true,
): ObjectProperty {
  return { key, required, node };
}
