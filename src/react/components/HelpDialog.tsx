export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="lss-modal-backdrop" onClick={onClose}>
      <div
        className="lss-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="lss-modal-head">
          <strong style={{ fontSize: '1.25rem' }}>Help & Concepts</strong>
          <button className="lss-btn lss-btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }} className="text-slate-700 dark:text-slate-300">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">What is a JSON Schema?</h3>
          <p className="mb-4 text-sm">
            A JSON Schema is a declarative contract that defines the expected shape, data types, and constraints of a JSON payload. In the context of LLMs (Large Language Models), you provide a schema to force the AI to return data in an exact, predictable format—perfect for passing straight into a database or API without parsing messy text.
          </p>

          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Writing Good Descriptions</h3>
          <p className="mb-4 text-sm">
            Descriptions are your primary tool for guiding the AI. Don't just say what the field is, explain <strong>how the AI should populate it</strong>. For example, instead of "Address", write "The shipping address of the customer, prioritizing the standard USPS format."
          </p>

          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Data Types Guide</h3>
          <ul className="list-disc pl-5 mb-4 text-sm flex flex-col gap-2">
            <li><strong>Object</strong>: A dictionary of key-value pairs (properties). Use this to group related fields (e.g. a "Person" object holding "name" and "age").</li>
            <li><strong>Array</strong>: A list of items. You define the shape of a single item, and the model generates a list of them.</li>
            <li><strong>String</strong>: Text. You can restrict it via regex (Pattern), formats (like 'email' or 'date'), or length boundaries.</li>
            <li><strong>Number / Integer</strong>: Numeric values. Can be constrained with minimum/maximum boundaries.</li>
            <li><strong>Boolean</strong>: True or false values.</li>
            <li><strong>Enum</strong>: A strict list of allowed values. The model MUST pick one of these exact values. Great for categories, statuses, or classifications.</li>
            <li><strong>Const</strong>: A single, hardcoded value. The model is forced to always return this exact value.</li>
            <li><strong>Union (anyOf)</strong>: Allows a field to be one of multiple shapes. Useful for polymorphic data (e.g. a payload that can be either a "Text Message" object OR an "Image Message" object).</li>
          </ul>

          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Strict Mode vs. Portable</h3>
          <p className="mb-4 text-sm">
            <strong>Portable</strong> is standard JSON Schema compatible with most systems. <br />
            <strong>Strict</strong> conforms to OpenAI's structured outputs requirements. It forces all properties to be "required" and handles optional fields by explicitly allowing "null" as a value.
          </p>

          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">External Resources</h3>
          <ul className="list-disc pl-5 mb-4 text-sm flex flex-col gap-2">
            <li><a href="https://json-schema.org/understanding-json-schema/" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline dark:text-sky-400">Understanding JSON Schema</a> – An excellent, readable guide to JSON Schema.</li>
            <li><a href="https://json-schema.org/understanding-json-schema/reference/type.html" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline dark:text-sky-400">JSON Schema Data Types</a> – Detailed breakdown of Objects, Arrays, Strings, etc.</li>
            <li><a href="https://json-schema.org/understanding-json-schema/reference/string.html#built-in-formats" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline dark:text-sky-400">JSON Schema String Formats</a> – Specs for formats like email, uri, date-time, etc.</li>
            <li><a href="https://platform.openai.com/docs/guides/structured-outputs" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline dark:text-sky-400">OpenAI Structured Outputs Guide</a> – Official docs on Strict mode and response formats.</li>
            <li><a href="https://swagger.io/specification/" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline dark:text-sky-400">OpenAPI Specification</a> – The standard defining REST APIs, which relies heavily on JSON Schema.</li>
            <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline dark:text-sky-400">MDN Web Docs: JSON</a> – Mozilla's reference on the JSON data format itself.</li>
          </ul>
        </div>

        <div className="lss-modal-actions pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
          <button className="lss-btn lss-btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
