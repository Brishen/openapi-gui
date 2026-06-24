import { useState } from 'react';
import type { SchemaNode } from '../../core';
import { generateCode, type CodeGenLanguage } from '../../core/codegen';

export function GenerateCodeDialog({
  open,
  model,
  onClose,
}: {
  open: boolean;
  model: SchemaNode;
  onClose: () => void;
}) {
  const [language, setLanguage] = useState<CodeGenLanguage>('typescript');
  const [rootName, setRootName] = useState('Root');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const code = generateCode(model, language, rootName);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="lss-modal-backdrop" onClick={onClose}>
      <div 
        className="lss-modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ width: '600px', maxWidth: '90vw' }}
      >
        <div className="lss-modal-head">
          <strong>Generate Code</strong>
          <button className="lss-btn lss-btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', padding: '0 16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 600 }}>Language</label>
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value as CodeGenLanguage)}
              style={{ 
                width: '100%',
                padding: '6px 8px', 
                borderRadius: '4px', 
                border: '1px solid var(--lss-border)',
                background: 'var(--lss-bg)'
              }}
            >
              <option value="typescript">TypeScript</option>
              <option value="python-pydantic">Python (Pydantic)</option>
              <option value="python-dataclass">Python (Dataclass)</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 600 }}>Root Name</label>
            <input 
              type="text" 
              value={rootName} 
              onChange={e => setRootName(e.target.value)}
              style={{ 
                width: '100%',
                padding: '6px 8px', 
                borderRadius: '4px', 
                border: '1px solid var(--lss-border)',
                background: 'var(--lss-bg)'
              }}
            />
          </div>
        </div>

        <div style={{ position: 'relative', padding: '0 16px 16px' }}>
          <pre style={{ 
            background: 'var(--lss-surface)', 
            border: '1px solid var(--lss-border)',
            padding: '12px', 
            borderRadius: '4px', 
            overflow: 'auto', 
            maxHeight: '400px',
            fontSize: '13px',
            margin: 0
          }}>
            <code>{code}</code>
          </pre>
          <button 
            className="lss-btn lss-btn-primary"
            onClick={handleCopy}
            style={{ 
              position: 'absolute', 
              top: '8px', 
              right: '24px', 
              padding: '4px 8px', 
              fontSize: '12px'
            }}
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        <div className="lss-modal-actions">
          <button className="lss-btn lss-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
