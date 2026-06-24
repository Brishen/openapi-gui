/**
 * Minimal JSON Schema (draft 2020-12) TypeScript types — only the keywords this
 * library emits and accepts. This is intentionally a small, pragmatic subset:
 * the full spec is far larger, but guided-decoding backends (xgrammar, outlines,
 * llama.cpp GBNF) only meaningfully support a slice of it.
 */

export type JsonSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

/** A JSON value that can appear in `enum` / `const`. We only model primitives. */
export type JsonPrimitive = string | number | boolean | null;

export interface JsonSchema {
  $schema?: string;
  $ref?: string;
  $defs?: Record<string, JsonSchema>;

  type?: JsonSchemaType | JsonSchemaType[];
  title?: string;
  description?: string;

  // composition
  anyOf?: JsonSchema[];

  // enum / const
  enum?: JsonPrimitive[];
  const?: JsonPrimitive;

  // string
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  // number / integer
  minimum?: number;
  maximum?: number;
  multipleOf?: number;

  // object
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;

  // array
  items?: JsonSchema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}

/**
 * The OpenAI-compatible `response_format` payload used to constrain output on
 * vLLM / llama.cpp endpoints. Drop directly into a chat-completions request.
 */
export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchema;
  };
}
