import type { Dispatch } from 'react';
import type { EnumNode, SchemaNode, StringFormat } from '../../core';
import type { Action, NodePatch } from '../state';
import { useIssues } from '../IssuesContext';

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
  const nodeIssues = useIssues(node.id);

  switch (node.kind) {
    case 'string': {
      const minLengthIssue = nodeIssues.find((i: any) => i.rule === 'invalid-minLength');
      const maxLengthIssue = nodeIssues.find((i: any) => i.rule === 'invalid-maxLength' || i.rule === 'invalid-length-range');

      return (
        <div className="lss-constraints">
          <label className="lss-field">
            <span title="A regular expression that the generated string must match" className="cursor-help border-b border-dotted border-slate-400 w-fit">Pattern</span>
            <input
              className="lss-input"
              value={node.pattern ?? ''}
              placeholder="^[0-9]{5}$"
              onChange={(e) => patch({ pattern: e.target.value })}
            />
          </label>
          <label className="lss-field">
            <span title="Pre-defined string formats like email, uri, or date-time" className="cursor-help border-b border-dotted border-slate-400 w-fit">Format</span>
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
          <div className="lss-field">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 cursor-help border-b border-dotted border-slate-400 w-fit" title="Minimum number of characters the string can contain">Min length</span>
              {minLengthIssue && <span className="lss-lint-badge lss-lint-error">Invalid</span>}
            </div>
            <input
              className={`lss-input ${minLengthIssue ? '!border-red-400 bg-red-50' : ''}`}
              type="number"
              value={node.minLength ?? ''}
              onChange={(e) => patch({ minLength: num(e.target.value) as number })}
            />
            {minLengthIssue && <div className="text-[11px] text-red-600 leading-tight">{minLengthIssue.message}</div>}
          </div>
          <div className="lss-field">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 cursor-help border-b border-dotted border-slate-400 w-fit" title="Maximum number of characters the string can contain">Max length</span>
              {maxLengthIssue && <span className="lss-lint-badge lss-lint-error">Invalid</span>}
            </div>
            <input
              className={`lss-input ${maxLengthIssue ? '!border-red-400 bg-red-50' : ''}`}
              type="number"
              value={node.maxLength ?? ''}
              onChange={(e) => patch({ maxLength: num(e.target.value) as number })}
            />
            {maxLengthIssue && <div className="text-[11px] text-red-600 leading-tight">{maxLengthIssue.message}</div>}
          </div>
        </div>
      );
    }

    case 'number':
    case 'integer':
      return (
        <div className="lss-constraints">
          <label className="lss-field">
            <span title="The lowest allowed value" className="cursor-help border-b border-dotted border-slate-400 w-fit">Minimum</span>
            <input
              className="lss-input"
              type="number"
              value={node.minimum ?? ''}
              onChange={(e) => patch({ minimum: num(e.target.value) as number })}
            />
          </label>
          <label className="lss-field">
            <span title="The highest allowed value" className="cursor-help border-b border-dotted border-slate-400 w-fit">Maximum</span>
            <input
              className="lss-input"
              type="number"
              value={node.maximum ?? ''}
              onChange={(e) => patch({ maximum: num(e.target.value) as number })}
            />
          </label>
          <label className="lss-field">
            <span title="The generated number must be a multiple of this value" className="cursor-help border-b border-dotted border-slate-400 w-fit">Multiple of</span>
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
            <span title="Minimum number of items required in this array" className="cursor-help border-b border-dotted border-slate-400 w-fit">Min items</span>
            <input
              className="lss-input"
              type="number"
              value={node.minItems ?? ''}
              onChange={(e) => patch({ minItems: num(e.target.value) as number })}
            />
          </label>
          <label className="lss-field">
            <span title="Maximum number of items allowed in this array" className="cursor-help border-b border-dotted border-slate-400 w-fit">Max items</span>
            <input
              className="lss-input"
              type="number"
              value={node.maxItems ?? ''}
              onChange={(e) => patch({ maxItems: num(e.target.value) as number })}
            />
          </label>
          <label className="lss-checkbox" title="If checked, all items generated in the list must be distinct">
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
      return <EnumEditor node={node} dispatch={dispatch} />;

    case 'const':
      return (
        <label className="lss-field">
          <span title="A single, exact value that the LLM MUST return for this field" className="cursor-help border-b border-dotted border-slate-400 w-fit">Constant value</span>
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

function EnumEditor({ node, dispatch }: { node: EnumNode; dispatch: Dispatch<Action> }) {
  const values = node.values;

  const updateValue = (index: number, val: string) => {
    const next = [...values];
    const parsed = val !== '' && !Number.isNaN(Number(val)) ? Number(val) : val;
    next[index] = parsed;
    dispatch({ type: 'setEnumValues', id: node.id, values: next });
  };

  const removeValue = (index: number) => {
    const next = values.filter((_, i) => i !== index);
    dispatch({ type: 'setEnumValues', id: node.id, values: next });
  };

  const addValue = () => {
    dispatch({ type: 'setEnumValues', id: node.id, values: [...values, 'new_value'] });
  };

  return (
    <div className="lss-field">
      <span title="A strict list of exact values the LLM is allowed to choose from" className="cursor-help border-b border-dotted border-slate-400 w-fit">Enum values</span>
      <div className="lss-enum-list">
        {values.map((v, i) => (
          <div key={i} className="lss-enum-item">
            <input
              className="lss-input lss-grow"
              value={String(v)}
              onChange={(e) => updateValue(i, e.target.value)}
            />
            <button
              className="lss-btn lss-btn-ghost"
              title="Remove value"
              onClick={() => removeValue(i)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button className="lss-btn" style={{ width: 'fit-content', marginTop: '4px' }} onClick={addValue}>
        + Add value
      </button>
    </div>
  );
}
