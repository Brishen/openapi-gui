import { useState } from 'react';
import type { SchemaNode } from '../../core';
import { parse } from '../../core';

/** Paste an existing JSON Schema -> parse -> load into the editor. Surfaces
 * parse errors and any keywords that couldn't be modeled. */
export function ImportDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (node: SchemaNode) => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState<string[]>([]);

  if (!open) return null;

  const doImport = () => {
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (e) {
      setError(`Invalid JSON: ${(e as Error).message}`);
      return;
    }
    try {
      const result = parse(json as never);
      setUnsupported(result.unsupported);
      setError(null);
      onImport(result.node);
      if (result.unsupported.length === 0) {
        setText('');
        onClose();
      }
    } catch (e) {
      setError(`Could not parse schema: ${(e as Error).message}`);
    }
  };

  return (
    <div className="lss-modal-backdrop" onClick={onClose}>
      <div className="lss-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lss-modal-head">
          <strong>Import JSON Schema</strong>
          <button className="lss-btn lss-btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <textarea
          className="lss-textarea"
          value={text}
          placeholder='{ "type": "object", "properties": { ... } }'
          onChange={(e) => setText(e.target.value)}
          rows={12}
        />
        {error && <div className="lss-lint-item lss-lint-error">{error}</div>}
        {unsupported.length > 0 && (
          <div className="lss-lint-item lss-lint-warning">
            Imported, but these keywords aren't modeled and were dropped:{' '}
            <code>{unsupported.join(', ')}</code>
          </div>
        )}
        <div className="lss-modal-actions">
          <button className="lss-btn lss-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="lss-btn lss-btn-primary" onClick={doImport}>
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
