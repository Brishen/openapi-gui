/**
 * Public React API. Optional peer entry — import from "llm-json-schema/react".
 * Re-exports the whole core API too, so consumers can stay on one import.
 */

export * from '../core';

export { SchemaBuilder } from './SchemaBuilder';
export type { SchemaBuilderProps } from './SchemaBuilder';

export { useSchemaBuilder, useImporter } from './useSchemaBuilder';
export type {
  UseSchemaBuilderOptions,
  SchemaBuilderState,
} from './useSchemaBuilder';

export { reducer, emptyModel } from './state';
export type { Action, NodePatch } from './state';

// Building-block components for custom UIs.
export { NodeEditor } from './components/NodeEditor';
export { ObjectFields } from './components/ObjectFields';
export { ConstraintsPanel } from './components/ConstraintsPanel';
export { TypePicker } from './components/TypePicker';
export { OutputPanel } from './components/OutputPanel';
export { LintList } from './components/LintList';
export { ImportDialog } from './components/ImportDialog';
