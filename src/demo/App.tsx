import { useState } from 'react';
import { SchemaBuilder } from '../react';
import {
  arrayNode,
  integerNode,
  objectNode,
  property,
  stringNode,
  type SchemaNode,
} from '../react';

/** A starter model so the demo opens on something concrete:
 * { name, age, tags[], address{ city, zip } }. */
function starter(): SchemaNode {
  return objectNode({
    title: 'Person',
    properties: [
      property('name', stringNode({ description: 'Full name' })),
      property('age', integerNode({ description: 'Age in years', minimum: 0 })),
      property('tags', arrayNode(stringNode(), { description: 'Freeform labels' })),
      property(
        'address',
        objectNode({
          properties: [
            property('city', stringNode()),
            property('zip', stringNode({ pattern: '^[0-9]{5}$' })),
          ],
        }),
      ),
    ],
  });
}

export default function App() {
  const [model] = useState<SchemaNode>(starter);

  return (
    <div className="demo-shell">
      <header className="demo-header">
        <h1>llm-json-schema</h1>
        <p>Build a JSON Schema to constrain LLM output, then copy the response_format.</p>
      </header>
      <SchemaBuilder defaultValue={model} />
    </div>
  );
}
