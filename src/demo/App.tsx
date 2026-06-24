import { useState, useEffect } from 'react';
import { SchemaBuilder } from '../react';
import type { SchemaNode } from '../react';
import { objectNode } from '../core';
import { EXAMPLES } from './examples';

export default function App() {
  const [savedSchemas, setSavedSchemas] = useState<Record<string, SchemaNode>>(() => {
    const stored = localStorage.getItem('llm-json-schema-saved');
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return {};
  });

  const [model, setModel] = useState<SchemaNode>(() => {
    const stored = localStorage.getItem('llm-json-schema-current');
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return EXAMPLES.Person();
  });

  const [isDark, setIsDark] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string>('Custom');

  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newConfirmOpen, setNewConfirmOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('llm-json-schema-current', JSON.stringify(model));
  }, [model]);

  useEffect(() => {
    localStorage.setItem('llm-json-schema-saved', JSON.stringify(savedSchemas));
  }, [savedSchemas]);

  const toggleDark = () => {
    setIsDark((prev) => !prev);
    document.documentElement.classList.toggle('dark');
  };

  const handleExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedExample(key);
    if (key.startsWith('saved:')) {
      const name = key.slice(6);
      if (savedSchemas[name]) setModel(savedSchemas[name]);
    } else if (EXAMPLES[key as keyof typeof EXAMPLES]) {
      setModel(EXAMPLES[key as keyof typeof EXAMPLES]());
    }
  };

  const handleSaveClick = () => {
    setSaveName(model.title || 'Untitled');
    setSavePromptOpen(true);
  };

  const doSave = () => {
    const name = saveName.trim();
    if (name) {
      setSavedSchemas(prev => ({ ...prev, [name]: model }));
      setSelectedExample(`saved:${name}`);
      setSavePromptOpen(false);
    }
  };

  const handleNewClick = () => {
    setNewConfirmOpen(true);
  };

  const doNew = () => {
    setModel(objectNode({ title: 'NewSchema', properties: [] }));
    setSelectedExample('Custom');
    setNewConfirmOpen(false);
  };

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const doDelete = () => {
    if (selectedExample.startsWith('saved:')) {
      const name = selectedExample.slice(6);
      const next = { ...savedSchemas };
      delete next[name];
      setSavedSchemas(next);
      setSelectedExample('Custom');
    }
    setDeleteConfirmOpen(false);
  };

  return (
    <div className="demo-shell">
      <header className="demo-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>llm-json-schema</h1>
          <p>Build a JSON Schema to constrain LLM output, then copy the response_format.</p>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-slate-600)' }}>Schema:</span>
            <select
              className="lss-select"
              value={selectedExample}
              onChange={handleExampleChange}
            >
              <option value="Custom">Current (Unsaved)</option>
              <optgroup label="Saved">
                {Object.keys(savedSchemas).map(key => (
                  <option key={`saved:${key}`} value={`saved:${key}`}>{key}</option>
                ))}
              </optgroup>
              <optgroup label="Examples">
                {Object.keys(EXAMPLES).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </optgroup>
            </select>
            <button onClick={handleNewClick} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: 'transparent', fontSize: '14px' }}>
              New
            </button>
            <button onClick={handleSaveClick} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: 'transparent', fontSize: '14px' }}>
              Save
            </button>
            {selectedExample.startsWith('saved:') && (
              <button onClick={handleDeleteClick} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', fontSize: '14px' }}>
                Delete
              </button>
            )}
          </div>
        </div>
        <button onClick={toggleDark} style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: 'transparent' }}>
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>
      <SchemaBuilder value={model} onChange={setModel} />

      {savePromptOpen && (
        <div className="lss-modal-backdrop" onClick={() => setSavePromptOpen(false)}>
          <div className="lss-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="lss-modal-head">
              <strong>Save Schema</strong>
              <button className="lss-btn lss-btn-ghost" onClick={() => setSavePromptOpen(false)}>✕</button>
            </div>
            <div style={{ padding: '16px' }}>
              <p style={{ marginBottom: '8px' }}>Name this schema to save it locally:</p>
              <input 
                autoFocus
                className="lss-input" 
                style={{ width: '100%' }}
                value={saveName} 
                onChange={e => setSaveName(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && doSave()}
              />
            </div>
            <div className="lss-modal-actions">
              <button className="lss-btn lss-btn-ghost" onClick={() => setSavePromptOpen(false)}>Cancel</button>
              <button className="lss-btn lss-btn-primary" onClick={doSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="lss-modal-backdrop" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="lss-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="lss-modal-head">
              <strong>Delete Schema</strong>
              <button className="lss-btn lss-btn-ghost" onClick={() => setDeleteConfirmOpen(false)}>✕</button>
            </div>
            <div style={{ padding: '16px' }}>
              <p>Are you sure you want to delete this saved schema?</p>
            </div>
            <div className="lss-modal-actions">
              <button className="lss-btn lss-btn-ghost" onClick={() => setDeleteConfirmOpen(false)}>Cancel</button>
              <button className="lss-btn lss-btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={doDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {newConfirmOpen && (
        <div className="lss-modal-backdrop" onClick={() => setNewConfirmOpen(false)}>
          <div className="lss-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="lss-modal-head">
              <strong>New Schema</strong>
              <button className="lss-btn lss-btn-ghost" onClick={() => setNewConfirmOpen(false)}>✕</button>
            </div>
            <div style={{ padding: '16px' }}>
              <p>Create a new blank schema? Unsaved changes will be lost.</p>
            </div>
            <div className="lss-modal-actions">
              <button className="lss-btn lss-btn-ghost" onClick={() => setNewConfirmOpen(false)}>Cancel</button>
              <button className="lss-btn lss-btn-primary" onClick={doNew}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
