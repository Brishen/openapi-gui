# llm-json-schema

Build a **JSON Schema** that describes the object you want an LLM to return, then
use it to constrain output on **OpenAI-compatible guided-decoding endpoints**
(vLLM, llama.cpp) running models like gemma-4, nemotron-3, or qwen-3.6.

- **Framework-free core** — compile a small editor model to JSON Schema +
  an OpenAI `response_format`, parse an existing schema back, and lint it against
  specific decoding backends.
- **Optional React UI** — a visual builder (`llm-json-schema/react`) for people
  with light programming knowledge. React is an optional peer dependency.

> The repo directory is historically named `openapi-gui`, but the package targets
> **JSON Schema**, not OpenAPI.

## Install

```sh
npm install llm-json-schema
# React UI is optional; bring your own React 18/19:
npm install react react-dom
```

## Core usage (no framework)

```ts
import {
  objectNode,
  stringNode,
  integerNode,
  arrayNode,
  property,
  compile,
} from 'llm-json-schema';

const model = objectNode({
  title: 'Person',
  properties: [
    property('name', stringNode({ description: 'Full name' })),
    property('age', integerNode({ description: 'Age in years', minimum: 0 })),
    property('tags', arrayNode(stringNode())),
    // optional field:
    property('nickname', stringNode(), /* required */ false),
  ],
});

const { schema, responseFormat, issues } = compile(model, {
  profile: 'portable', // or 'strict'
  name: 'person',
});
```

Drop `responseFormat` straight into a chat-completions request:

```ts
await fetch('http://localhost:8000/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gemma-4',
    messages: [{ role: 'user', content: 'Describe Ada Lovelace.' }],
    response_format: responseFormat,
  }),
});
```

### Compile profiles

Guided-decoding backends support different slices of JSON Schema, so `compile`
offers two shapes:

| Profile              | Optional properties                                  | `additionalProperties`           | `strict` |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- |
| `portable` (default) | omitted from `required`                              | `false` (your choice per object) | `false`  |
| `strict` (OpenAI)    | listed in `required`, type widened to `["T","null"]` | forced `false` on every object   | `true`   |

Use `portable` for the broadest backend compatibility (xgrammar / outlines /
llama.cpp GBNF). Use `strict` when targeting OpenAI strict structured outputs.

### Round-trip an existing schema

```ts
import { parse, compile } from 'llm-json-schema';

const { node, unsupported } = parse(existingJsonSchema);
// `unsupported` lists keywords the model doesn't represent (warn, don't drop).
const { schema } = compile(node, { profile: 'portable' });
```

The portable round-trip (`parse(compile(model).schema)`) reproduces the model for
supported features. The strict profile's optional-encoding is inherently
ambiguous with a required-nullable property, so a strict-compiled optional field
round-trips as required-nullable.

### Lint against a backend

```ts
import { lint } from 'llm-json-schema';

const problems = lint(node, { backend: 'llamacpp' });
// e.g. warns that `pattern` is unsupported and `format` is ignored on llama.cpp,
// plus quality nudges like "this field has no description".
```

## React UI

```tsx
import { SchemaBuilder } from 'llm-json-schema/react';
import 'llm-json-schema/styles.css'; // prebuilt — no Tailwind setup needed

export function App() {
  return <SchemaBuilder defaultValue={/* optional initial model */ undefined} />;
}
```

`<SchemaBuilder>` works controlled (`value` + `onChange`) or uncontrolled
(`defaultValue`). It shows a node-tree editor on the left and the live JSON
Schema + `response_format` + lint issues on the right, with an import dialog for
pasting an existing schema.

Prefer your own UI? Use the headless hook:

```tsx
import { useSchemaBuilder } from 'llm-json-schema/react';

const { model, dispatch, output, issues } = useSchemaBuilder({
  profile: 'strict',
  backend: 'vllm-xgrammar',
});
```

All UI classes are prefixed `lss-` to avoid collisions in host apps.

## Development

```sh
npm run dev        # demo playground (src/demo) on the Vite dev server
npm test           # vitest: compile, round-trip, Ajv validation, lint rules
npm run typecheck  # tsc -b
npm run lint       # eslint
npm run build      # library ESM build (dist/) + prebuilt dist/styles.css
```

### Verifying against a real backend (manual)

Start a local vLLM or llama.cpp OpenAI server, POST the generated
`response_format`, and confirm the completion parses against `schema` (e.g. with
Ajv). This step is documented rather than automated.

## License

MIT
