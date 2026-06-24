import { describe, expect, it } from 'vitest';
import { compile } from '../src/core';
import { sampleModel } from './helpers';

describe('compile', () => {
  it('portable profile: optional props omitted from required, not null-widened', () => {
    const { schema, responseFormat } = compile(sampleModel(), {
      profile: 'portable',
      name: 'person',
    });

    expect(schema.type).toBe('object');
    // nickname is optional -> absent from required, and a plain string.
    expect(schema.required).toEqual(['name', 'age', 'tags', 'address']);
    expect(schema.properties?.nickname).toEqual({ type: 'string' });
    expect(schema.additionalProperties).toBe(false);

    // response_format envelope is ready to POST.
    expect(responseFormat).toEqual({
      type: 'json_schema',
      json_schema: { name: 'person', strict: false, schema },
    });
  });

  it('strict profile: every prop required, optional expressed as ["T","null"]', () => {
    const { schema, responseFormat } = compile(sampleModel(), { profile: 'strict' });

    expect(schema.required).toEqual(['name', 'age', 'tags', 'address', 'nickname']);
    expect(schema.properties?.nickname).toEqual({ type: ['string', 'null'] });
    expect(responseFormat.json_schema.strict).toBe(true);
    // additionalProperties:false is forced on every object, including nested.
    expect(schema.additionalProperties).toBe(false);
    expect((schema.properties?.address as { additionalProperties: boolean }).additionalProperties).toBe(
      false,
    );
  });

  it('reports duplicate property names as errors', () => {
    const { issues } = compile(
      {
        kind: 'object',
        id: 'o',
        additionalProperties: false,
        properties: [
          { key: 'a', required: true, node: { kind: 'string', id: '1' } },
          { key: 'a', required: true, node: { kind: 'string', id: '2' } },
        ],
      },
      {},
    );
    expect(issues.some((i) => i.level === 'error' && /Duplicate/.test(i.message))).toBe(true);
  });

  it('sanitizes response_format name to ^[a-zA-Z0-9_-]+$', () => {
    const { responseFormat } = compile({ kind: 'string', id: 's' }, { name: 'my schema!' });
    expect(responseFormat.json_schema.name).toBe('my_schema_');
  });
});
