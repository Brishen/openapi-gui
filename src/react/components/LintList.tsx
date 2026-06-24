import type { CompileIssue, Issue } from '../../core';

type AnyIssue = (Issue | CompileIssue) & { path?: string; rule?: string };

/** Renders compile + lint issues with severity styling. */
export function LintList({ issues }: { issues: AnyIssue[] }) {
  if (issues.length === 0) {
    return <div className="lss-lint-empty">No issues.</div>;
  }
  return (
    <ul className="lss-lint">
      {issues.map((issue, i) => (
        <li key={i} className={`lss-lint-item lss-lint-${issue.level}`}>
          <span className="lss-lint-badge">{issue.level}</span>
          {issue.path && <code className="lss-lint-path">{issue.path}</code>}
          <span className="lss-lint-msg">{issue.message}</span>
        </li>
      ))}
    </ul>
  );
}
