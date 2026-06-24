import type { Dispatch } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = node.properties.findIndex((p) => p.node.id === active.id);
      const newIndex = node.properties.findIndex((p) => p.node.id === over.id);
      dispatch({ type: 'reorderProperty', objectId: node.id, from: oldIndex, to: newIndex });
    }
  }

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={node.properties.map((p) => p.node.id)}
          strategy={verticalListSortingStrategy}
        >
          {node.properties.map((prop, i) => (
            <SortableProperty
              key={prop.node.id}
              prop={prop}
              index={i}
              nodeId={node.id}
              dispatch={dispatch}
              depth={depth}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableProperty({
  prop,
  index,
  nodeId,
  dispatch,
  depth,
}: {
  prop: ObjectNode['properties'][0];
  index: number;
  nodeId: string;
  dispatch: Dispatch<Action>;
  depth: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: prop.node.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="lss-property">
      <div className="lss-property-head">
        <div
          className="lss-drag-handle flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7 15 12 20 17 15"></polyline>
            <polyline points="7 9 12 4 17 9"></polyline>
          </svg>
        </div>
        <input
          className="lss-input lss-key"
          value={prop.key}
          placeholder="field_name"
          onChange={(e) =>
            dispatch({ type: 'renameProperty', objectId: nodeId, index, key: e.target.value })
          }
        />
        <label className="lss-checkbox cursor-help" title="If checked, the LLM MUST provide this field. In strict mode, all fields are required by default.">
          <input
            type="checkbox"
            checked={prop.required}
            onChange={() => dispatch({ type: 'toggleRequired', objectId: nodeId, index })}
          />
          <span>required</span>
        </label>
        <div className="lss-spacer" />
        <button
          className="lss-btn lss-btn-ghost"
          title="Remove field"
          onClick={() => dispatch({ type: 'removeProperty', objectId: nodeId, index })}
        >
          ✕
        </button>
      </div>
      <NodeEditor node={prop.node} dispatch={dispatch} depth={depth + 1} />
    </div>
  );
}
