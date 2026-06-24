/**
 * Public core API — framework-free. Build a schema model, compile it to JSON
 * Schema + an OpenAI `response_format`, parse an existing schema back into the
 * model, and lint it against guided-decoding backends.
 */

// Model + factories
export type {
  SchemaNode,
  NodeKind,
  NodeBase,
  StringNode,
  NumberNode,
  BooleanNode,
  ObjectNode,
  ObjectProperty,
  ArrayNode,
  EnumNode,
  ConstNode,
  UnionNode,
  StringFormat,
} from './model';
export {
  makeId,
  stringNode,
  numberNode,
  integerNode,
  booleanNode,
  objectNode,
  arrayNode,
  enumNode,
  constNode,
  unionNode,
  property,
} from './model';

// JSON Schema types + response_format
export type {
  JsonSchema,
  JsonSchemaType,
  JsonPrimitive,
  ResponseFormat,
} from './json-schema';

// Compile
export type {
  CompileProfile,
  CompileOptions,
  CompileResult,
  CompileIssue,
} from './compile';
export { compile, buildResponseFormat } from './compile';

// Parse
export type { ParseResult } from './parse';
export { parse } from './parse';

// Backends
export type { BackendId, BackendInfo, Support, TrackedKeyword } from './backends';
export { BACKENDS, BACKEND_INFO, SUPPORT_MATRIX, supportFor } from './backends';

// Lint
export type { Issue, LintOptions } from './lint';
export { lint } from './lint';
