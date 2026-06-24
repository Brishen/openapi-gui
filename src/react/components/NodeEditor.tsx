import type { Dispatch } from 'react';
import type { JsonPrimitive, NodeKind, SchemaNode } from '../../core';
import type { Action } from '../state';
import { ConstraintsPanel } from './ConstraintsPanel';
import { ObjectFields } from './ObjectFields';
import { TypePicker } from './TypePicker';
import { useIssues } from '../IssuesContext';

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
  const nodeIssues = useIssues(node.id);
  const invalidExampleIssue = nodeIssues.find((i: any) => i.rule === 'invalid-example');

  return (
    <div className="lss-node" data-depth={depth} id={`node-${node.id}`}>
      {label && <div className="lss-node-label">{label}</div>}

      {depth === 0 && (
        <label className="lss-field" style={{ marginBottom: '8px' }}>
          <span title="The overall name of your schema (e.g., 'Order', 'CustomerProfile')" className="text-xs text-slate-600 dark:text-slate-300 cursor-help border-b border-dotted border-slate-400 w-fit">Schema Title</span>
          <input
            className="lss-input lss-grow"
            style={{ fontWeight: 600 }}
            placeholder="e.g. UserProfile"
            value={node.title ?? ''}
            onChange={(e) =>
              dispatch({ type: 'patchNode', id: node.id, patch: { title: e.target.value } })
            }
          />
        </label>
      )}

      <div className="lss-node-row" style={{ alignItems: 'flex-start' }}>
        <label className="lss-field">
          <span className="text-xs text-slate-600 dark:text-slate-300">Type</span>
          <TypePicker
            value={node.kind}
            onChange={(kind: NodeKind) => dispatch({ type: 'changeKind', id: node.id, kind })}
          />
        </label>
        <label className="lss-field lss-grow">
          <span title="Guides the LLM on how to populate this field. Be specific!" className="text-xs text-slate-600 dark:text-slate-300 cursor-help border-b border-dotted border-slate-400 w-fit">Description</span>
          <input
            className="lss-input w-full"
            placeholder="e.g. The user's full name"
            value={node.description ?? ''}
            onChange={(e) =>
              dispatch({ type: 'patchNode', id: node.id, patch: { description: e.target.value } })
            }
          />
        </label>
        <div className="lss-field" style={{ justifyContent: 'flex-end', paddingBottom: '4px' }}>
          <label className="lss-checkbox cursor-help" title="If checked, the LLM is allowed to return null instead of a value.">
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
      </div>

      <ConstraintsPanel node={node} dispatch={dispatch} />

      {EXAMPLE_KINDS.has(node.kind) && (
        <div className="lss-field">
          <div className="flex items-center justify-between">
            <span title="Examples to guide the LLM on the expected shape of the value" className="text-xs text-slate-600 cursor-help border-b border-dotted border-slate-400 w-fit">Examples (comma-separated)</span>
            {invalidExampleIssue && (
              <span className="lss-lint-badge lss-lint-error" title="This example violates the schema constraints">
                Invalid
              </span>
            )}
          </div>
          <input
            className={`lss-input ${invalidExampleIssue ? '!border-red-400 bg-red-50' : ''}`}
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
          {invalidExampleIssue && (
            <div className="text-[11px] text-red-600 leading-tight">
              {invalidExampleIssue.message}
            </div>
          )}
        </div>
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
