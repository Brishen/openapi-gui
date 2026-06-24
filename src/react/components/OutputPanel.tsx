import { useState } from 'react';
import type { BackendId, CompileProfile, CompileResult, Issue } from '../../core';
import { BACKENDS, BACKEND_INFO } from '../../core';
import { LintList } from './LintList';
import { TestPanel } from './TestPanel';
import type { SchemaNode } from '../../core';
import { generateMock } from '../../core';

/** Right-hand pane: profile + backend selectors, live JSON Schema +
 * response_format with a copy button, and the issue list. */
export function OutputPanel({
  output,
  issues,
  profile,
  backend,
  model,
  onProfileChange,
  onBackendChange,
}: {
  output: CompileResult;
  issues: Issue[];
  profile: CompileProfile;
  backend: BackendId | undefined;
  model?: SchemaNode;
  onProfileChange: (p: CompileProfile) => void;
  onBackendChange: (b: BackendId | undefined) => void;
}) {
  const responseFormatJson = JSON.stringify(output.responseFormat, null, 2);
  const allIssues = [...output.issues, ...issues];
  const [viewMode, setViewMode] = useState<'schema' | 'mock'>('schema');
  const mockJson = model ? JSON.stringify(generateMock(model), null, 2) : '';

  return (
    <div className="lss-output">
      <div className="lss-output-controls">
        <label className="lss-field lss-inline">
          <span>Profile</span>
          <select
            className="lss-select"
            value={profile}
            onChange={(e) => onProfileChange(e.target.value as CompileProfile)}
          >
            <option value="portable">portable</option>
            <option value="strict">strict (OpenAI)</option>
          </select>
        </label>
        <label className="lss-field lss-inline">
          <span>Backend</span>
          <select
            className="lss-select"
            value={backend ?? ''}
            onChange={(e) => onBackendChange(e.target.value ? (e.target.value as BackendId) : undefined)}
          >
            <option value="">(any)</option>
            {BACKENDS.map((b) => (
              <option key={b} value={b}>
                {BACKEND_INFO[b].label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
          <label className="lss-test-toggle" style={{ color: viewMode === 'schema' ? 'inherit' : 'var(--color-slate-400)', opacity: viewMode === 'schema' ? 1 : 0.5 }}>
            <input type="radio" name="viewMode" value="schema" checked={viewMode === 'schema'} onChange={() => setViewMode('schema')} style={{ display: 'none' }} />
            Schema
          </label>
          {model && (
            <label className="lss-test-toggle" style={{ color: viewMode === 'mock' ? 'inherit' : 'var(--color-slate-400)', opacity: viewMode === 'mock' ? 1 : 0.5 }}>
              <input type="radio" name="viewMode" value="mock" checked={viewMode === 'mock'} onChange={() => setViewMode('mock')} style={{ display: 'none' }} />
              Mock Data
            </label>
          )}
        </div>
        {viewMode === 'schema' ? (
          <CodeBlock title="response_format" code={responseFormatJson} />
        ) : (
          <CodeBlock title="mock_data.json" code={mockJson} />
        )}
      </div>

      <div className="lss-issues">
        <div className="lss-issues-title">Issues</div>
        <LintList issues={allIssues} />
      </div>

      <TestPanel schema={output.schema} />
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="lss-code">
      <div className="lss-code-head">
        <span>{title}</span>
        <button className="lss-btn" onClick={copy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="lss-pre" data-testid="output-code">
        <code>{code}</code>
      </pre>
    </div>
  );
}
