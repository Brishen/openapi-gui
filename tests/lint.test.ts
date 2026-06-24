import { describe, expect, it } from 'vitest';
import { lint } from '../src/core';
import type { SchemaNode } from '../src/core';

const zip: SchemaNode = {
  kind: 'object',
  id: 'o',
  additionalProperties: false,
  properties: [
    {
      key: 'zip',
      required: true,
      node: { kind: 'string', id: 'z', description: 'postcode', pattern: '^[0-9]{5}$' },
    },
    {
      key: 'kind',
      required: true,
      node: { kind: 'string', id: 'k', description: 'type', format: 'email' },
    },
  ],
};

describe('lint', () => {
  it('flags pattern as unsupported on llama.cpp', () => {
    const issues = lint(zip, { backend: 'llamacpp' });
    expect(issues.some((i) => i.rule === 'unsupported-pattern' && i.path === 'zip')).toBe(true);
  });

  it('flags format as ignored on llama.cpp', () => {
    const issues = lint(zip, { backend: 'llamacpp' });
    expect(issues.some((i) => i.rule === 'ignored-format' && i.path === 'kind')).toBe(true);
  });

  it('does not flag pattern on xgrammar', () => {
    const issues = lint(zip, { backend: 'vllm-xgrammar' });
    expect(issues.some((i) => i.rule === 'unsupported-pattern')).toBe(false);
  });

  it('nudges about missing descriptions', () => {
    const issues = lint({ kind: 'string', id: 's' });
    expect(issues.some((i) => i.rule === 'missing-description')).toBe(true);
  });

  it('warns on fractional multipleOf', () => {
    const issues = lint({ kind: 'number', id: 'n', description: 'x', multipleOf: 0.1 });
    expect(issues.some((i) => i.rule === 'multipleOf-float')).toBe(true);
  });

  it('errors on empty enum', () => {
    const issues = lint({ kind: 'enum', id: 'e', values: [] });
    expect(issues.some((i) => i.rule === 'empty-enum')).toBe(true);
  });

  it('errors on duplicate enum values', () => {
    const issues = lint({ kind: 'enum', id: 'e', values: ['a', 'b', 'a'] });
    expect(issues.some((i) => i.rule === 'duplicate-enum')).toBe(true);
  });

  it('errors on examples that violate the schema', () => {
    const issues = lint({
      kind: 'string',
      id: 's',
      minLength: 5,
      examples: ['short', 'ok'], // 'ok' is too short!
    });
    const invalidExampleIssue = issues.find((i) => i.rule === 'invalid-example');
    expect(invalidExampleIssue).toBeDefined();
    expect(invalidExampleIssue?.message).toMatch(/Example "ok" is invalid/);
  });

  it('errors on invalid string length bounds', () => {
    const issues = lint({
      kind: 'string',
      id: 's',
      minLength: -1,
      maxLength: 0,
    });
    expect(issues.some((i) => i.rule === 'invalid-minLength')).toBe(true);
    expect(issues.some((i) => i.rule === 'invalid-maxLength')).toBe(true);
  });

  it('errors when minLength > maxLength', () => {
    const issues = lint({
      kind: 'string',
      id: 's',
      minLength: 10,
      maxLength: 5,
    });
    expect(issues.some((i) => i.rule === 'invalid-length-range')).toBe(true);
  });
});
