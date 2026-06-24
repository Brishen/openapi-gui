/**
 * Headless hook: owns the editor model and derives the compiled output + lint
 * issues. Use this directly to build a custom UI, or use <SchemaBuilder/> for
 * the batteries-included one.
 */

import { useCallback, useMemo, useReducer } from 'react';
import type {
  BackendId,
  CompileProfile,
  CompileResult,
  Issue,
  SchemaNode,
} from '../core';
import { compile, lint } from '../core';
import type { Action } from './state';
import { emptyModel, reducer } from './state';

export interface UseSchemaBuilderOptions {
  initial?: SchemaNode;
  profile?: CompileProfile;
  backend?: BackendId;
  /** json_schema name in the response_format envelope. */
  name?: string;
}

export interface SchemaBuilderState {
  model: SchemaNode;
  dispatch: React.Dispatch<Action>;
  /** Compiled JSON Schema + response_format + structural issues. */
  output: CompileResult;
  /** Backend/quality lint issues for the current model. */
  issues: Issue[];
}

export function useSchemaBuilder(options: UseSchemaBuilderOptions = {}): SchemaBuilderState {
  const { initial, profile = 'portable', backend, name } = options;
  const [model, dispatch] = useReducer(reducer, undefined, () => initial ?? emptyModel());

  const output = useMemo(
    () => compile(model, { profile, name }),
    [model, profile, name],
  );

  const issues = useMemo(
    () => lint(model, { backend, profile }),
    [model, backend, profile],
  );

  return { model, dispatch, output, issues };
}

/** Stable callback-style import helper, handy for controlled usages. */
export function useImporter(dispatch: React.Dispatch<Action>) {
  return useCallback(
    (node: SchemaNode) => dispatch({ type: 'import', node }),
    [dispatch],
  );
}
