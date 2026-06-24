import type { SchemaNode } from './model';
import { generateMock } from './mock';

export type CodeGenLanguage = 'typescript' | 'python-pydantic' | 'python-dataclass';

export function generateCode(node: SchemaNode, language: CodeGenLanguage, rootName: string = 'Root'): string {
  switch (language) {
    case 'typescript':
      return generateTypeScript(node, rootName);
    case 'python-pydantic':
      return generatePythonPydantic(node, rootName);
    case 'python-dataclass':
      return generatePythonDataclass(node, rootName);
    default:
      return '';
  }
}

function generateTypeScript(node: SchemaNode, name: string): string {
  const interfaces: string[] = [];
  
  function walk(n: SchemaNode, currentName: string): string {
    switch (n.kind) {
      case 'object': {
        const props = n.properties.map(p => {
          const propType = walk(p.node, `${currentName}_${capitalize(p.key)}`);
          return `  ${p.key}${p.required ? '' : '?'}: ${propType};`;
        }).join('\n');
        
        const interfaceStr = `export interface ${currentName} {\n${props}\n}`;
        interfaces.push(interfaceStr);
        return currentName;
      }
      case 'array': {
        const itemType = walk(n.items, `${currentName}Item`);
        return `${itemType}[]`;
      }
      case 'string':
        if (n.enum && n.enum.length > 0) {
          return n.enum.map(e => `"${e}"`).join(' | ');
        }
        return 'string';
      case 'number':
      case 'integer':
        if (n.enum && n.enum.length > 0) {
          return n.enum.join(' | ');
        }
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'enum':
        return n.values.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(' | ');
      case 'const':
        return typeof n.value === 'string' ? `"${n.value}"` : String(n.value);
      case 'union':
        return n.options.map((opt, i) => walk(opt, `${currentName}Option${i}`)).join(' | ');
      default:
        return 'any';
    }
  }

  const rootType = walk(node, name);
  
  // If the root is not an object, we should export a type alias
  if (node.kind !== 'object') {
    interfaces.push(`export type ${name} = ${rootType};`);
  }

  const mockObj = generateMock(node);
  const mockJsonLines = JSON.stringify(mockObj, null, 2).split('\n');
  const commentedJson = mockJsonLines.map(line => `// ${line}`).join('\n');

  const usageExample = `
// Example Usage:
// const jsonStr = \`
${commentedJson}
// \`;
//
// // Load valid JSON into the generated code
// const obj: ${name} = JSON.parse(jsonStr);
//
// // Export JSON from instances of the generated classes
// const exportedJsonStr = JSON.stringify(obj);`;

  return interfaces.reverse().join('\n\n') + '\n' + usageExample;
}

function generatePythonPydantic(node: SchemaNode, name: string): string {
  const classes: string[] = [];
  const imports = new Set<string>(['from pydantic import BaseModel, Field']);
  let hasList = false;
  let hasUnion = false;
  let hasOptional = false;
  let hasLiteral = false;

  function walk(n: SchemaNode, currentName: string, isRequired: boolean = true): string {
    let typeStr = 'Any';
    switch (n.kind) {
      case 'object': {
        const props = n.properties.map(p => {
          const propType = walk(p.node, `${currentName}_${capitalize(p.key)}`, p.required);
          const fieldArgs = [];
          if (p.node.description) {
            fieldArgs.push(`description="${p.node.description.replace(/"/g, '\\"')}"`);
          }
          
          if (p.node.kind === 'string') {
            if (p.node.minLength !== undefined) fieldArgs.push(`min_length=${p.node.minLength}`);
            if (p.node.maxLength !== undefined) fieldArgs.push(`max_length=${p.node.maxLength}`);
            if (p.node.pattern) fieldArgs.push(`pattern=r"${p.node.pattern.replace(/"/g, '\\"')}"`);
          } else if (p.node.kind === 'number' || p.node.kind === 'integer') {
            if (p.node.minimum !== undefined) fieldArgs.push(`ge=${p.node.minimum}`);
            if (p.node.maximum !== undefined) fieldArgs.push(`le=${p.node.maximum}`);
            if (p.node.multipleOf !== undefined) fieldArgs.push(`multiple_of=${p.node.multipleOf}`);
          } else if (p.node.kind === 'array') {
            if (p.node.minItems !== undefined) fieldArgs.push(`min_length=${p.node.minItems}`);
            if (p.node.maxItems !== undefined) fieldArgs.push(`max_length=${p.node.maxItems}`);
          }

          let fieldDef = '';
          if (fieldArgs.length > 0) {
             fieldDef = p.required ? ` = Field(..., ${fieldArgs.join(', ')})` : ` = Field(None, ${fieldArgs.join(', ')})`;
          } else if (!p.required) {
             fieldDef = ' = None';
          }
          return `    ${p.key}: ${propType}${fieldDef}`;
        });
        
        const classBody = props.length > 0 ? props.join('\n') : '    pass';
        const classStr = `class ${currentName}(BaseModel):\n${classBody}`;
        classes.push(classStr);
        typeStr = currentName;
        break;
      }
      case 'array': {
        const itemType = walk(n.items, `${currentName}Item`, true);
        hasList = true;
        typeStr = `List[${itemType}]`;
        break;
      }
      case 'string':
        if (n.enum && n.enum.length > 0) {
          hasLiteral = true;
          typeStr = `Literal[${n.enum.map(e => `"${e}"`).join(', ')}]`;
        } else {
          typeStr = 'str';
        }
        break;
      case 'number':
        if (n.enum && n.enum.length > 0) {
           hasLiteral = true;
           typeStr = `Literal[${n.enum.join(', ')}]`;
        } else {
           typeStr = 'float';
        }
        break;
      case 'integer':
        if (n.enum && n.enum.length > 0) {
           hasLiteral = true;
           typeStr = `Literal[${n.enum.join(', ')}]`;
        } else {
           typeStr = 'int';
        }
        break;
      case 'boolean':
        typeStr = 'bool';
        break;
      case 'enum':
        hasLiteral = true;
        typeStr = `Literal[${n.values.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ')}]`;
        break;
      case 'const':
        hasLiteral = true;
        typeStr = `Literal[${typeof n.value === 'string' ? `"${n.value}"` : String(n.value)}]`;
        break;
      case 'union':
        hasUnion = true;
        const options = n.options.map((opt, i) => walk(opt, `${currentName}Option${i}`, true));
        typeStr = `Union[${options.join(', ')}]`;
        break;
    }

    if (!isRequired) {
       hasOptional = true;
       return `Optional[${typeStr}]`;
    }
    return typeStr;
  }

  const rootType = walk(node, name);
  
  if (node.kind !== 'object') {
    classes.push(`${name} = ${rootType}`);
  }

  const typingImports = [];
  if (hasList) typingImports.push('List');
  if (hasUnion) typingImports.push('Union');
  if (hasOptional) typingImports.push('Optional');
  if (hasLiteral) typingImports.push('Literal');
  if (typingImports.length > 0 || classes.some(c => c.includes('Any'))) {
      if (classes.some(c => c.includes('Any'))) typingImports.push('Any');
      imports.add(`from typing import ${typingImports.join(', ')}`);
  }

  const importStr = Array.from(imports).join('\n');
  
  const mockObj = generateMock(node);
  const mockJsonLines = JSON.stringify(mockObj, null, 2).split('\n');
  const commentedJson = mockJsonLines.map(line => `# ${line}`).join('\n');

  const usageExample = `
# Example Usage:
# json_str = """
${commentedJson}
# """
#
# # Load valid JSON into the generated code
# obj = ${name}.model_validate_json(json_str)
#
# # Export JSON from instances of the generated classes
# exported_json_str = obj.model_dump_json()`;

  return `${importStr}\n\n${classes.reverse().join('\n\n')}\n${usageExample}\n`;
}

function generatePythonDataclass(node: SchemaNode, name: string): string {
  const classes: string[] = [];
  const imports = new Set<string>(['from dataclasses import dataclass, field']);
  let hasList = false;
  let hasUnion = false;
  let hasOptional = false;
  let hasLiteral = false;

  function walk(n: SchemaNode, currentName: string, isRequired: boolean = true): string {
    let typeStr = 'Any';
    switch (n.kind) {
      case 'object': {
        const props = n.properties.map(p => {
          const propType = walk(p.node, `${currentName}_${capitalize(p.key)}`, p.required);
          let fieldDef = '';
          if (!p.required) {
             fieldDef = ' = None';
          }
          return `    ${p.key}: ${propType}${fieldDef}`;
        });
        
        const classBody = props.length > 0 ? props.join('\n') : '    pass';
        const classStr = `@dataclass\nclass ${currentName}:\n${classBody}`;
        classes.push(classStr);
        typeStr = currentName;
        break;
      }
      case 'array': {
        const itemType = walk(n.items, `${currentName}Item`, true);
        hasList = true;
        typeStr = `List[${itemType}]`;
        break;
      }
      case 'string':
        if (n.enum && n.enum.length > 0) {
          hasLiteral = true;
          typeStr = `Literal[${n.enum.map(e => `"${e}"`).join(', ')}]`;
        } else {
          typeStr = 'str';
        }
        break;
      case 'number':
        if (n.enum && n.enum.length > 0) {
           hasLiteral = true;
           typeStr = `Literal[${n.enum.join(', ')}]`;
        } else {
           typeStr = 'float';
        }
        break;
      case 'integer':
        if (n.enum && n.enum.length > 0) {
           hasLiteral = true;
           typeStr = `Literal[${n.enum.join(', ')}]`;
        } else {
           typeStr = 'int';
        }
        break;
      case 'boolean':
        typeStr = 'bool';
        break;
      case 'enum':
        hasLiteral = true;
        typeStr = `Literal[${n.values.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ')}]`;
        break;
      case 'const':
        hasLiteral = true;
        typeStr = `Literal[${typeof n.value === 'string' ? `"${n.value}"` : String(n.value)}]`;
        break;
      case 'union':
        hasUnion = true;
        const options = n.options.map((opt, i) => walk(opt, `${currentName}Option${i}`, true));
        typeStr = `Union[${options.join(', ')}]`;
        break;
    }

    if (!isRequired) {
       hasOptional = true;
       return `Optional[${typeStr}]`;
    }
    return typeStr;
  }

  const rootType = walk(node, name);
  
  if (node.kind !== 'object') {
    classes.push(`${name} = ${rootType}`);
  }

  const typingImports = [];
  if (hasList) typingImports.push('List');
  if (hasUnion) typingImports.push('Union');
  if (hasOptional) typingImports.push('Optional');
  if (hasLiteral) typingImports.push('Literal');
  if (typingImports.length > 0 || classes.some(c => c.includes('Any'))) {
      if (classes.some(c => c.includes('Any'))) typingImports.push('Any');
      imports.add(`from typing import ${typingImports.join(', ')}`);
  }

  const importStr = Array.from(imports).join('\n');

  const mockObj = generateMock(node);
  const mockJsonLines = JSON.stringify(mockObj, null, 2).split('\n');
  const commentedJson = mockJsonLines.map(line => `# ${line}`).join('\n');

  const usageExample = `
# Example Usage:
# import json
# from dataclasses import asdict
#
# json_str = """
${commentedJson}
# """
#
# # Load valid JSON into the generated code
# # (Note: for nested dataclasses, you may need a library like \`dacite\`)
# obj = ${name}(**json.loads(json_str))
#
# # Export JSON from instances of the generated classes
# exported_json_str = json.dumps(asdict(obj))`;

  return `${importStr}\n\n${classes.reverse().join('\n\n')}\n${usageExample}\n`;
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
