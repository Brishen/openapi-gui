import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import { compile } from '../src/core';
import { sampleModel } from './helpers';

function makeAjv() {
  const ajv = new Ajv2020({ strict: false });
  addFormats(ajv);
  return ajv;
}

describe('emitted schemas are valid JSON Schema 2020-12', () => {
  for (const profile of ['portable', 'strict'] as const) {
    it(`${profile}: Ajv compiles the schema and validates a conforming instance`, () => {
      const { schema } = compile(sampleModel(), { profile });
      const ajv = makeAjv();

      const validate = ajv.compile(schema);
      const instance = {
        name: 'Ada',
        age: 36,
        tags: ['math'],
        address: { city: 'London', zip: '12345' },
        nickname: profile === 'strict' ? null : undefined,
      };
      expect(validate(instance)).toBe(true);
    });
  }
});
