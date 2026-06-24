/**
 * Keyword-support matrix for the guided-decoding backends this library targets.
 *
 * These ratings are pragmatic, not exhaustive: guided decoding constrains tokens
 * to a grammar derived from the schema, and each backend's grammar compiler
 * supports a different slice of JSON Schema. "ignored" keywords are accepted but
 * have no effect on the constraint; "unsupported" keywords may error or behave
 * unpredictably. The linter (`lint.ts`) reads this matrix to warn the user.
 */

export type BackendId = 'vllm-xgrammar' | 'vllm-outlines' | 'llamacpp';

export const BACKENDS: readonly BackendId[] = [
  'vllm-xgrammar',
  'vllm-outlines',
  'llamacpp',
];

export interface BackendInfo {
  id: BackendId;
  label: string;
}

export const BACKEND_INFO: Record<BackendId, BackendInfo> = {
  'vllm-xgrammar': { id: 'vllm-xgrammar', label: 'vLLM (xgrammar)' },
  'vllm-outlines': { id: 'vllm-outlines', label: 'vLLM (outlines)' },
  llamacpp: { id: 'llamacpp', label: 'llama.cpp (GBNF)' },
};

/** How well a backend honors a given keyword. */
export type Support = 'full' | 'ignored' | 'unsupported';

/**
 * Keywords whose support varies across backends. Anything not listed here is
 * assumed to be `full` (e.g. type/properties/required/enum/items — the
 * structural backbone every backend handles).
 */
export type TrackedKeyword =
  | 'pattern'
  | 'format'
  | 'minLength'
  | 'maxLength'
  | 'minimum'
  | 'maximum'
  | 'multipleOf'
  | 'minItems'
  | 'maxItems'
  | 'uniqueItems';

type Matrix = Record<TrackedKeyword, Record<BackendId, Support>>;

export const SUPPORT_MATRIX: Matrix = {
  // Regex constraints: xgrammar/outlines support them; llama.cpp's GBNF
  // converter does not honor `pattern`.
  pattern: {
    'vllm-xgrammar': 'full',
    'vllm-outlines': 'full',
    llamacpp: 'unsupported',
  },
  // `format` (date-time, email, uuid, ...): outlines maps a handful to regexes;
  // xgrammar honors common ones; llama.cpp ignores them.
  format: {
    'vllm-xgrammar': 'full',
    'vllm-outlines': 'full',
    llamacpp: 'ignored',
  },
  // Length / range / count bounds are not expressible in most grammar
  // converters, so they are silently ignored rather than enforced.
  minLength: { 'vllm-xgrammar': 'full', 'vllm-outlines': 'ignored', llamacpp: 'ignored' },
  maxLength: { 'vllm-xgrammar': 'full', 'vllm-outlines': 'ignored', llamacpp: 'ignored' },
  minimum: { 'vllm-xgrammar': 'ignored', 'vllm-outlines': 'ignored', llamacpp: 'ignored' },
  maximum: { 'vllm-xgrammar': 'ignored', 'vllm-outlines': 'ignored', llamacpp: 'ignored' },
  multipleOf: { 'vllm-xgrammar': 'ignored', 'vllm-outlines': 'ignored', llamacpp: 'ignored' },
  minItems: { 'vllm-xgrammar': 'full', 'vllm-outlines': 'ignored', llamacpp: 'ignored' },
  maxItems: { 'vllm-xgrammar': 'full', 'vllm-outlines': 'ignored', llamacpp: 'ignored' },
  uniqueItems: { 'vllm-xgrammar': 'ignored', 'vllm-outlines': 'ignored', llamacpp: 'ignored' },
};

export function supportFor(keyword: TrackedKeyword, backend: BackendId): Support {
  return SUPPORT_MATRIX[keyword][backend];
}
