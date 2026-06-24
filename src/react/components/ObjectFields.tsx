import type { Dispatch } from 'react';
import type { ObjectNode } from '../../core';
import type { Action } from '../state';
import { NodeEditor } from './NodeEditor';

/** Renders an object's ordered property list: rename, required, reorder, remove,
 * plus a recursive editor for each property's node. */
export function ObjectFields({
  node,
  dispatch,
  depth,
}: {
  node: ObjectNode;
  dispatch: Dispatch<Action>;
  depth: number;
}) {
  return (
    <div className="lss-object">
      <div className="lss-object-toolbar">
        <button
          className="lss-btn"
          onClick={() => dispatch({ type: 'addProperty', objectId: node.id })}
        >
          + Add field
        </button>
        <label className="lss-checkbox" title="Allow properties not listed here">
          <input
            type="checkbox"
            checked={node.additionalProperties}
            onChange={(e) =>
              dispatch({
                type: 'patchNode',
                id: node.id,
                patch: { additionalProperties: e.target.checked },
              })
            }
          />
          <span>additional properties</span>
        </label>
      </div>

      {node.properties.length === 0 && (
        <div className="lss-empty">No fields yet — add one above.</div>
      )}

      {node.properties.map((prop, i) => (
        <div key={prop.node.id} className="lss-property">
          <div className="lss-property-head">
            <input
              className="lss-input lss-key"
              value={prop.key}
              placeholder="field_name"
              onChange={(e) =>
                dispatch({ type: 'renameProperty', objectId: node.id, index: i, key: e.target.value })
              }
            />
            <label className="lss-checkbox">
              <input
                type="checkbox"
                checked={prop.required}
                onChange={() => dispatch({ type: 'toggleRequired', objectId: node.id, index: i })}
              />
              <span>required</span>
            </label>
            <div className="lss-spacer" />
            <button
              className="lss-btn lss-btn-ghost"
              disabled={i === 0}
              title="Move up"
              onClick={() =>
                dispatch({ type: 'reorderProperty', objectId: node.id, from: i, to: i - 1 })
              }
            >
              ↑
            </button>
            <button
              className="lss-btn lss-btn-ghost"
              disabled={i === node.properties.length - 1}
              title="Move down"
              onClick={() =>
                dispatch({ type: 'reorderProperty', objectId: node.id, from: i, to: i + 1 })
              }
            >
              ↓
            </button>
            <button
              className="lss-btn lss-btn-ghost"
              title="Remove field"
              onClick={() => dispatch({ type: 'removeProperty', objectId: node.id, index: i })}
            >
              ✕
            </button>
          </div>
          <NodeEditor node={prop.node} dispatch={dispatch} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}
