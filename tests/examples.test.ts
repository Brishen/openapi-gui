import { describe, expect, it } from 'vitest';
import { compile, parse, stringNode } from '../src/core';
import { stripIds } from './helpers';

describe('examples', () => {
  it('compiles node examples into the JSON Schema `examples` annotation', () => {
    const { schema } = compile(stringNode({ examples: ['ada', 'grace'] }));
    expect(schema.examples).toEqual(['ada', 'grace']);
  });

  it('omits examples when empty', () => {
    const { schema } = compile(stringNode({ examples: [] }));
    expect(schema.examples).toBeUndefined();
  });

  it('round-trips examples through parse', () => {
    const model = stringNode({ description: 'name', examples: ['ada'] });
    const { schema } = compile(model, { profile: 'portable' });
    const { node } = parse(schema);
    expect(stripIds(node)).toEqual(stripIds(model));
  });
});
