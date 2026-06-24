import type { Dispatch } from 'react';
import type { JsonPrimitive, NodeKind, SchemaNode } from '../../core';
import type { Action } from '../state';
import { ConstraintsPanel } from './ConstraintsPanel';
import { ObjectFields } from './ObjectFields';
import { TypePicker } from './TypePicker';

// Examples are most useful on scalar leaves; object/array/union examples would
// be whole structures, which a comma-separated field can't express.
const EXAMPLE_KINDS: ReadonlySet<NodeKind> = new Set<NodeKind>([
  'string',
  'number',
  'integer',
  'boolean',
  'enum',
]);

/** Parse a comma-separated examples field, coercing to the node's value type. */
function parseExamples(raw: string, kind: NodeKind): JsonPrimitive[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s): JsonPrimitive => {
      if (kind === 'number' || kind === 'integer') {
        const n = Number(s);
        return Number.isNaN(n) ? s : n;
      }
      if (kind === 'boolean') {
        if (s === 'true') return true;
        if (s === 'false') return false;
      }
      return s;
    });
}

/**
 * Recursive editor for a single node. Renders shared metadata + a type picker +
 * kind-specific constraints, then recurses into object properties, array items,
 * and union options.
 */
export function NodeEditor({
  node,
  dispatch,
  label,
  depth = 0,
}: {
  node: SchemaNode;
  dispatch: Dispatch<Action>;
  /** Optional header (e.g. a property key or "Array items"). */
  label?: string;
  depth?: number;
}) {
  return (
    <div className="lss-node" data-depth={depth}>
      {label && <div className="lss-node-label">{label}</div>}

      <div className="lss-node-row">
        <TypePicker
          value={node.kind}
          onChange={(kind: NodeKind) => dispatch({ type: 'changeKind', id: node.id, kind })}
        />
        <input
          className="lss-input lss-grow"
          placeholder="Description (helps the model)"
          value={node.description ?? ''}
          onChange={(e) =>
            dispatch({ type: 'patchNode', id: node.id, patch: { description: e.target.value } })
          }
        />
        <label className="lss-checkbox" title="Allow null">
          <input
            type="checkbox"
            checked={node.nullable ?? false}
            onChange={(e) =>
              dispatch({ type: 'patchNode', id: node.id, patch: { nullable: e.target.checked } })
            }
          />
          <span>nullable</span>
        </label>
      </div>

      <ConstraintsPanel node={node} dispatch={dispatch} />

      {EXAMPLE_KINDS.has(node.kind) && (
        <label className="lss-field">
          <span>Examples (comma-separated)</span>
          <input
            className="lss-input"
            placeholder="e.g. Ada, Grace"
            value={(node.examples ?? []).map((v) => String(v)).join(', ')}
            onChange={(e) =>
              dispatch({
                type: 'setExamples',
                id: node.id,
                values: parseExamples(e.target.value, node.kind),
              })
            }
          />
        </label>
      )}

      {node.kind === 'object' && <ObjectFields node={node} dispatch={dispatch} depth={depth} />}

      {node.kind === 'array' && (
        <div className="lss-nested">
          <NodeEditor node={node.items} dispatch={dispatch} label="Array items" depth={depth + 1} />
        </div>
      )}

      {node.kind === 'union' && (
        <div className="lss-nested">
          {node.options.map((opt, i) => (
            <div key={opt.id} className="lss-union-option">
              <NodeEditor node={opt} dispatch={dispatch} label={`Option ${i + 1}`} depth={depth + 1} />
              <button
                className="lss-btn lss-btn-ghost"
                onClick={() => dispatch({ type: 'removeUnionOption', unionId: node.id, index: i })}
              >
                Remove option
              </button>
            </div>
          ))}
          <button
            className="lss-btn"
            onClick={() => dispatch({ type: 'addUnionOption', unionId: node.id })}
          >
            + Add option
          </button>
        </div>
      )}
    </div>
  );
}
