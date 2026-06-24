import type { NodeKind } from '../../core';

const KINDS: { value: NodeKind; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'integer', label: 'Integer' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'Object' },
  { value: 'array', label: 'Array' },
  { value: 'enum', label: 'Enum' },
  { value: 'const', label: 'Const' },
  { value: 'union', label: 'Union (any of)' },
];

export function TypePicker({
  value,
  onChange,
}: {
  value: NodeKind;
  onChange: (kind: NodeKind) => void;
}) {
  return (
    <select
      className="lss-select"
      value={value}
      onChange={(e) => onChange(e.target.value as NodeKind)}
      aria-label="Type"
    >
      {KINDS.map((k) => (
        <option key={k.value} value={k.value}>
          {k.label}
        </option>
      ))}
    </select>
  );
}
