import type { Dispatch } from 'react';
import type { NodeKind, SchemaNode } from '../../core';
import type { Action } from '../state';
import { ConstraintsPanel } from './ConstraintsPanel';
import { ObjectFields } from './ObjectFields';
import { TypePicker } from './TypePicker';

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
