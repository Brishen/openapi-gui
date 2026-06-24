import { useEffect, useState, useMemo } from 'react';
import type { BackendId, CompileProfile, SchemaNode } from '../core';
import { NodeEditor } from './components/NodeEditor';
import { OutputPanel } from './components/OutputPanel';
import { ImportDialog } from './components/ImportDialog';
import { HelpDialog } from './components/HelpDialog';
import { useSchemaBuilder } from './useSchemaBuilder';
import { IssuesContext } from './IssuesContext';

export interface SchemaBuilderProps {
  /** Controlled model. When provided, `onChange` must keep it in sync. */
  value?: SchemaNode;
  onChange?: (model: SchemaNode) => void;
  /** Initial model for uncontrolled usage. */
  defaultValue?: SchemaNode;
  /** Compile profile (default "portable"). */
  profile?: CompileProfile;
  /** Backend to lint against (default: none / "any"). */
  backend?: BackendId;
  /** json_schema name in the response_format envelope. */
  name?: string;
  className?: string;
}

/**
 * Batteries-included editor: left pane edits the node tree, right pane shows the
 * live response_format + issues. Works controlled (`value`/`onChange`) or
 * uncontrolled (`defaultValue`).
 */
export function SchemaBuilder(props: SchemaBuilderProps) {
  const controlled = props.value !== undefined;
  if (controlled) return <ControlledBuilder {...props} />;
  return <UncontrolledBuilder {...props} />;
}

function UncontrolledBuilder(props: SchemaBuilderProps) {
  const [profile, setProfile] = useState<CompileProfile>(props.profile ?? 'portable');
  const [backend, setBackend] = useState<BackendId | undefined>(props.backend);
  const [importOpen, setImportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const { model, dispatch, output, issues } = useSchemaBuilder({
    initial: props.defaultValue,
    profile,
    backend,
    name: props.name,
  });

  useEffect(() => {
    props.onChange?.(model);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  const allIssues = useMemo(() => [...output.issues, ...issues], [output.issues, issues]);

  return (
    <Layout
      className={props.className}
      onImportClick={() => setImportOpen(true)}
      onHelpClick={() => setHelpOpen(true)}
      editor={
        <IssuesContext.Provider value={allIssues}>
          <NodeEditor node={model} dispatch={dispatch} />
        </IssuesContext.Provider>
      }
      output={
        <OutputPanel
          output={output}
          issues={issues}
          profile={profile}
          backend={backend}
          model={model}
          onProfileChange={setProfile}
          onBackendChange={setBackend}
        />
      }
      dialog={
        <>
          <ImportDialog
            open={importOpen}
            onClose={() => setImportOpen(false)}
            onImport={(node) => dispatch({ type: 'import', node })}
          />
          <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
        </>
      }
    />
  );
}

function ControlledBuilder(props: SchemaBuilderProps) {
  // In controlled mode we still use the reducer internally, but mirror every
  // change out via onChange and accept external value updates.
  const [profile, setProfile] = useState<CompileProfile>(props.profile ?? 'portable');
  const [backend, setBackend] = useState<BackendId | undefined>(props.backend);
  const [importOpen, setImportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const { model, dispatch, output, issues } = useSchemaBuilder({
    initial: props.value,
    profile,
    backend,
    name: props.name,
  });

  // Push internal edits outward.
  useEffect(() => {
    if (model !== props.value) props.onChange?.(model);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  // Pull external value in.
  useEffect(() => {
    if (props.value && props.value !== model) dispatch({ type: 'import', node: props.value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  const allIssues = useMemo(() => [...output.issues, ...issues], [output.issues, issues]);

  return (
    <Layout
      className={props.className}
      onImportClick={() => setImportOpen(true)}
      onHelpClick={() => setHelpOpen(true)}
      editor={
        <IssuesContext.Provider value={allIssues}>
          <NodeEditor node={model} dispatch={dispatch} />
        </IssuesContext.Provider>
      }
      output={
        <OutputPanel
          output={output}
          issues={issues}
          profile={profile}
          backend={backend}
          model={model}
          onProfileChange={setProfile}
          onBackendChange={setBackend}
        />
      }
      dialog={
        <>
          <ImportDialog
            open={importOpen}
            onClose={() => setImportOpen(false)}
            onImport={(node) => dispatch({ type: 'import', node })}
          />
          <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
        </>
      }
    />
  );
}

function Layout({
  className,
  editor,
  output,
  dialog,
  onImportClick,
  onHelpClick,
}: {
  className?: string;
  editor: React.ReactNode;
  output: React.ReactNode;
  dialog: React.ReactNode;
  onImportClick: () => void;
  onHelpClick: () => void;
}) {
  return (
    <div className={`lss-root ${className ?? ''}`}>
      <div className="lss-header">
        <strong className="lss-title">Schema Builder</strong>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="lss-btn lss-btn-ghost text-slate-500" onClick={onHelpClick}>
            Help
          </button>
          <button className="lss-btn" onClick={onImportClick}>
            Import schema…
          </button>
        </div>
      </div>
      <div className="lss-panes">
        <div className="lss-editor-pane">{editor}</div>
        <div className="lss-output-pane">{output}</div>
      </div>
      {dialog}
    </div>
  );
}
