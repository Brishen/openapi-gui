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
});
