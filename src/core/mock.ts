import type { SchemaNode, StringFormat } from './model';

/**
 * Generates a mock JSON payload that roughly satisfies the given schema tree.
 * Prioritizes user-provided examples. Falls back to sensible defaults.
 */
export function generateMock(node: SchemaNode): unknown {
  if (node.examples && node.examples.length > 0) {
    return node.examples[0];
  }

  switch (node.kind) {
    case 'string':
      return mockString(node.format);
    case 'number':
    case 'integer':
      if (node.enum && node.enum.length > 0) return node.enum[0];
      if (node.minimum !== undefined) return node.minimum;
      if (node.maximum !== undefined) return node.maximum;
      return 0;
    case 'boolean':
      return true;
    case 'enum':
      return node.values.length > 0 ? node.values[0] : '';
    case 'const':
      return node.value;
    case 'array': {
      const length = node.minItems ?? 1;
      return Array.from({ length }, () => generateMock(node.items));
    }
    case 'object': {
      const obj: Record<string, unknown> = {};
      for (const prop of node.properties) {
        // Even if not required, it's helpful to mock it to show the shape
        obj[prop.key] = generateMock(prop.node);
      }
      if (node.additionalProperties) {
        obj['extra_property'] = 'some_value';
      }
      return obj;
    }
    case 'union':
      if (node.options.length > 0) {
        return generateMock(node.options[0]);
      }
      return null;
    default:
      return null;
  }
}

function mockString(format?: StringFormat): string {
  switch (format) {
    case 'date-time':
      return new Date().toISOString();
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'time':
      return new Date().toISOString().split('T')[1].replace('Z', '');
    case 'email':
      return 'user@example.com';
    case 'hostname':
      return 'example.com';
    case 'ipv4':
      return '192.168.1.1';
    case 'ipv6':
      return '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    case 'uri':
      return 'https://example.com/path';
    case 'uuid':
      return '123e4567-e89b-12d3-a456-426614174000';
    case 'duration':
      return 'P3Y6M4DT12H30M5S';
    default:
      return 'string';
  }
}
