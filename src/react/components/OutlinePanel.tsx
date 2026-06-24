import type { SchemaNode } from '../../core';

export function OutlinePanel({ model }: { model: SchemaNode }) {
  return (
    <div className="lss-outline">
      <div className="lss-outline-title">Outline</div>
      <OutlineNode node={model} label="Root" />
    </div>
  );
}

function OutlineNode({ node, label }: { node: SchemaNode; label: string }) {
  const scrollToNode = () => {
    document.getElementById(`node-${node.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const nodeName = node.title || label;

  return (
    <div className="lss-outline-node">
      <div className="lss-outline-item" onClick={scrollToNode}>
        <span className="lss-outline-name">{nodeName}</span>
        <span className="lss-outline-kind">{node.kind}</span>
      </div>
      {node.kind === 'object' && node.properties.length > 0 && (
        <div className="lss-outline-children">
          {node.properties.map((prop) => (
            <OutlineNode key={prop.node.id} node={prop.node} label={prop.key} />
          ))}
        </div>
      )}
      {node.kind === 'array' && (
        <div className="lss-outline-children">
          <OutlineNode node={node.items} label="items" />
        </div>
      )}
      {node.kind === 'union' && (
        <div className="lss-outline-children">
          {node.options.map((opt, i) => (
            <OutlineNode key={opt.id} node={opt} label={`option ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}
