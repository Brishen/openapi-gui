import { describe, expect, it } from 'vitest';
import { compile, validateInstance } from '../src/core';
import { sampleModel } from './helpers';

describe('validateInstance', () => {
  const { schema } = compile(sampleModel(), { profile: 'portable' });

  it('accepts a conforming instance', () => {
    const result = validateInstance(schema, {
      name: 'Ada',
      age: 36,
      tags: ['math'],
      address: { city: 'London', zip: '12345' },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a non-conforming instance with errors', () => {
    const result = validateInstance(schema, {
      name: 'Ada',
      age: -1, // violates minimum: 0
      tags: ['math'],
      address: { city: 'London', zip: 'abc' }, // violates pattern ^[0-9]{5}$
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('reports missing required properties', () => {
    const result = validateInstance(schema, { name: 'Ada' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns an error (does not throw) on a type mismatch', () => {
    const result = validateInstance(schema, 'not an object');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
