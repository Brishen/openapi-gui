import { useState } from 'react';
import { SchemaBuilder } from '../react';
import type { SchemaNode } from '../react';
import { EXAMPLES } from './examples';

export default function App() {
  const [model, setModel] = useState<SchemaNode>(EXAMPLES.Person());
  const [isDark, setIsDark] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string>('Person');

  const toggleDark = () => {
    setIsDark((prev) => !prev);
    document.documentElement.classList.toggle('dark');
  };

  const handleExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedExample(key);
    setModel(EXAMPLES[key]());
  };

  return (
    <div className="demo-shell">
      <header className="demo-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>llm-json-schema</h1>
          <p>Build a JSON Schema to constrain LLM output, then copy the response_format.</p>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-slate-600)' }}>Load Example:</span>
            <select
              value={selectedExample}
              onChange={handleExampleChange}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                background: 'transparent',
                fontSize: '14px',
              }}
            >
              {Object.keys(EXAMPLES).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={toggleDark} style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: 'transparent' }}>
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>
      <SchemaBuilder value={model} onChange={setModel} />
    </div>
  );
}
