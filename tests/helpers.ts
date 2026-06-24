import type { SchemaNode } from '../src/core';

/** Deep-clone a node tree with all `id` fields removed, for structural equality. */
export function stripIds(node: SchemaNode): unknown {
  return JSON.parse(JSON.stringify(node, (key, value) => (key === 'id' ? undefined : value)));
}

/** A representative nested model: { name, age, tags[], address{}, nickname? }. */
export function sampleModel(): SchemaNode {
  return {
    kind: 'object',
    id: 'root',
    title: 'Person',
    additionalProperties: false,
    properties: [
      { key: 'name', required: true, node: { kind: 'string', id: 'n', description: 'Full name' } },
      { key: 'age', required: true, node: { kind: 'integer', id: 'a', minimum: 0 } },
      {
        key: 'tags',
        required: true,
        node: {
          kind: 'array',
          id: 't',
          items: { kind: 'string', id: 'ti' },
        },
      },
      {
        key: 'address',
        required: true,
        node: {
          kind: 'object',
          id: 'ad',
          additionalProperties: false,
          properties: [
            { key: 'city', required: true, node: { kind: 'string', id: 'c' } },
            { key: 'zip', required: true, node: { kind: 'string', id: 'z', pattern: '^[0-9]{5}$' } },
          ],
        },
      },
      // optional, non-null property — round-trips losslessly under `portable`
      { key: 'nickname', required: false, node: { kind: 'string', id: 'nk' } },
    ],
  };
}
