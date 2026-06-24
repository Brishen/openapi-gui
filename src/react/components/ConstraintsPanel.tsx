import type { Dispatch } from 'react';
import type { SchemaNode, StringFormat } from '../../core';
import type { Action, NodePatch } from '../state';

const STRING_FORMATS: StringFormat[] = [
  'date-time',
  'date',
  'time',
  'duration',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'uri',
  'uuid',
];

function num(value: string): number | '' {
  if (value.trim() === '') return '';
  const n = Number(value);
  return Number.isNaN(n) ? '' : n;
}

/** Kind-specific constraint inputs. Generic meta (title/description/nullable)
 * lives in NodeEditor; this panel only renders type-specific knobs. */
export function ConstraintsPanel({
  node,
  dispatch,
}: {
  node: SchemaNode;
  dispatch: Dispatch<Action>;
}) {
  const patch = (p: NodePatch) => dispatch({ type: 'patchNode', id: node.id, patch: p });

  switch (node.kind) {
    case 'string':
      return (
        <div className="lss-constraints">
          <label className="lss-field">
            <span>Pattern</span>
            <input
              className="lss-input"
              value={node.pattern ?? ''}
              placeholder="^[0-9]{5}$"
              onChange={(e) => patch({ pattern: e.target.value })}
            />
          </label>
          <label className="lss-field">
            <span>Format</span>
            <select
              className="lss-select"
              value={node.format ?? ''}
              onChange={(e) =>
                patch({ format: e.target.value ? (e.target.value as StringFormat) : undefined })
              }
            >
              <option value="">(none)</option>
              {STRING_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="lss-field">
            <span>Min length</span>
            <input
              className="lss-input"
              type="number"
              value={node.minLength ?? ''}
              onChange={(e) => patch({ minLength: num(e.target.value) as number })}
            />
          </label>
          <label className="lss-field">
            <span>Max length</span>
            <input
              className="lss-input"
              type="number"
              value={node.maxLength ?? ''}
              onChange={(e) => patch({ maxLength: num(e.target.value) as number })}
            />
          </label>
        </div>
      );

    case 'number':
    case 'integer':
      return (
        <div className="lss-constraints">
          <label className="lss-field">
            <span>Minimum</span>
            <input
              className="lss-input"
              type="number"
              value={node.minimum ?? ''}
              onChange={(e) => patch({ minimum: num(e.target.value) as number })}
            />
          </label>
          <label className="lss-field">
            <span>Maximum</span>
            <input
              className="lss-input"
              type="number"
              value={node.maximum ?? ''}
              onChange={(e) => patch({ maximum: num(e.target.value) as number })}
            />
          </label>
          <label className="lss-field">
            <span>Multiple of</span>
            <input
              className="lss-input"
              type="number"
              value={node.multipleOf ?? ''}
              onChange={(e) => patch({ multipleOf: num(e.target.value) as number })}
            />
          </label>
        </div>
      );

    case 'array':
      return (
        <div className="lss-constraints">
          <label className="lss-field">
            <span>Min items</span>
            <input
              className="lss-input"
              type="number"
              value={node.minItems ?? ''}
              onChange={(e) => patch({ minItems: num(e.target.value) as number })}
            />
          </label>
          <label className="lss-field">
            <span>Max items</span>
            <input
              className="lss-input"
              type="number"
              value={node.maxItems ?? ''}
              onChange={(e) => patch({ maxItems: num(e.target.value) as number })}
            />
          </label>
          <label className="lss-checkbox">
            <input
              type="checkbox"
              checked={node.uniqueItems ?? false}
              onChange={(e) => patch({ uniqueItems: e.target.checked })}
            />
            <span>Unique items</span>
          </label>
        </div>
      );

    case 'enum':
      return (
        <label className="lss-field">
          <span>Values (comma-separated)</span>
          <input
            className="lss-input"
            value={node.values.join(', ')}
            placeholder="open, closed, pending"
            onChange={(e) =>
              dispatch({
                type: 'setEnumValues',
                id: node.id,
                values: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
                  .map((s) => (s !== '' && !Number.isNaN(Number(s)) ? Number(s) : s)),
              })
            }
          />
        </label>
      );

    case 'const':
      return (
        <label className="lss-field">
          <span>Constant value</span>
          <input
            className="lss-input"
            value={String(node.value ?? '')}
            onChange={(e) =>
              dispatch({ type: 'setConstValue', id: node.id, value: e.target.value })
            }
          />
        </label>
      );

    default:
      return null;
  }
}
