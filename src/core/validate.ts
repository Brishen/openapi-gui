/**
 * validateInstance: check a concrete JSON value against a compiled JSON Schema.
 *
 * Uses the same engine as the test suite (Ajv 2020-12 + ajv-formats), so UI
 * results match the proven `tests/validate.test.ts` behavior.
 */

import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import type { JsonSchema } from './json-schema';

export interface InstanceError {
  /** JSON Pointer to the offending location, or a sentinel like "(root)". */
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: InstanceError[];
}

/**
 * Validate `data` against `schema`. A fresh Ajv instance is built per call: the
 * schema changes on every edit, and reusing one instance would leak compiled
 * schemas into its cache. The cost is negligible for a manual test action.
 */
export function validateInstance(schema: JsonSchema, data: unknown): ValidationResult {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);

  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (err) {
    return {
      valid: false,
      errors: [{ path: '(schema)', message: messageOf(err) }],
    };
  }

  const valid = validate(data) as boolean;
  if (valid) return { valid: true, errors: [] };

  const errors: InstanceError[] = (validate.errors ?? []).map((err) => ({
    path: err.instancePath || '(root)',
    message: err.message ?? 'is invalid',
  }));
  return { valid: false, errors };
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
