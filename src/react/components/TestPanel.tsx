import { useState } from 'react';
import type { JsonSchema, ValidationResult } from '../../core';
import { validateInstance } from '../../core';

type TestResult =
  | { kind: 'parse-error'; message: string }
  | { kind: 'validated'; result: ValidationResult };

/** Paste a JSON object and check it against the currently-compiled schema. */
export function TestPanel({ schema }: { schema: JsonSchema }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);

  const run = () => {
    let data: unknown;
    try {
      data = JSON.parse(input);
    } catch (err) {
      setResult({ kind: 'parse-error', message: err instanceof Error ? err.message : String(err) });
      return;
    }
    setResult({ kind: 'validated', result: validateInstance(schema, data) });
  };

  return (
    <div className="lss-test">
      <button className="lss-test-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} Test JSON
      </button>

      {open && (
        <>
          <textarea
            className="lss-textarea lss-test-textarea"
            data-testid="test-input"
            rows={6}
            placeholder={'{\n  "name": "Ada"\n}'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div>
            <button className="lss-btn lss-btn-primary" data-testid="test-run" onClick={run}>
              Validate
            </button>
          </div>
          {result && <TestResultView result={result} />}
        </>
      )}
    </div>
  );
}

function TestResultView({ result }: { result: TestResult }) {
  if (result.kind === 'parse-error') {
    return (
      <div className="lss-test-result">
        <span className="lss-test-badge lss-test-bad" data-testid="test-result">
          Invalid JSON
        </span>
        <ul className="lss-lint">
          <li className="lss-lint-item lss-lint-error">
            <span className="lss-lint-msg">{result.message}</span>
          </li>
        </ul>
      </div>
    );
  }

  const { valid, errors } = result.result;
  if (valid) {
    return (
      <div className="lss-test-result">
        <span className="lss-test-badge lss-test-ok" data-testid="test-result">
          Valid ✓
        </span>
      </div>
    );
  }

  return (
    <div className="lss-test-result">
      <span className="lss-test-badge lss-test-bad" data-testid="test-result">
        Invalid
      </span>
      <ul className="lss-lint">
        {errors.map((err, i) => (
          <li key={i} className="lss-lint-item lss-lint-error">
            <code className="lss-lint-path">{err.path}</code>
            <span className="lss-lint-msg">{err.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
