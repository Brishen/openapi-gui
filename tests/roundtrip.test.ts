import { describe, expect, it } from 'vitest';
import { compile, parse } from '../src/core';
import { sampleModel, stripIds } from './helpers';

describe('round-trip', () => {
  it('parse(compile(model)) reproduces the model under the portable profile', () => {
    const model = sampleModel();
    const { schema } = compile(model, { profile: 'portable' });
    const { node, unsupported } = parse(schema);

    expect(unsupported).toEqual([]);
    expect(stripIds(node)).toEqual(stripIds(model));
  });

  it('preserves a nullable union and enum/const through a round-trip', () => {
    const model = {
      kind: 'object' as const,
      id: 'o',
      additionalProperties: false,
      properties: [
        {
          key: 'status',
          required: true,
          node: { kind: 'enum' as const, id: 'e', values: ['open', 'closed'] },
        },
        {
          key: 'score',
          required: true,
          node: { kind: 'number' as const, id: 's', nullable: true },
        },
        {
          key: 'either',
          required: true,
          node: {
            kind: 'union' as const,
            id: 'u',
            options: [
              { kind: 'string' as const, id: 'us' },
              { kind: 'integer' as const, id: 'ui' },
            ],
          },
        },
      ],
    };

    const { schema } = compile(model, { profile: 'portable' });
    const { node } = parse(schema);
    expect(stripIds(node)).toEqual(stripIds(model));
  });

  it('records unsupported keywords instead of dropping them silently', () => {
    const { unsupported } = parse({
      type: 'object',
      properties: { a: { type: 'string', contentEncoding: 'base64' } },
      patternProperties: { '^x': { type: 'string' } },
    } as never);
    expect(unsupported).toContain('contentEncoding');
    expect(unsupported).toContain('patternProperties');
  });
});
