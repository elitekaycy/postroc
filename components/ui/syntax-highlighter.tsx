'use client';

interface SyntaxHighlighterProps {
  code: string;
  language: 'json' | 'xml' | 'text' | 'javascript';
}

export function SyntaxHighlighter({ code, language }: SyntaxHighlighterProps) {
  if (language === 'text') {
    return <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">{code}</pre>;
  }

  let highlighted: string;
  switch (language) {
    case 'json':
      highlighted = highlightJSON(code);
      break;
    case 'xml':
      highlighted = highlightXML(code);
      break;
    case 'javascript':
      highlighted = highlightJavaScript(code);
      break;
    default:
      highlighted = escapeHtml(code);
  }

  return (
    <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightJSON(code: string): string {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'text-[var(--foreground)]';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-blue-600 dark:text-blue-400'; // key
        } else {
          cls = 'text-green-600 dark:text-green-400'; // string
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-600 dark:text-purple-400'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-gray-500 dark:text-gray-400'; // null
      } else {
        cls = 'text-orange-600 dark:text-orange-400'; // number
      }
      return `<span class="${cls}">${match}</span>`;
    });
}

function highlightXML(code: string): string {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(&lt;\?xml[^?]*\?&gt;)/g, '<span class="text-gray-500 dark:text-gray-400">$1</span>') // declaration
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-gray-500 dark:text-gray-400">$1</span>') // comments
    .replace(/(&lt;\/?)([a-zA-Z0-9_-]+)/g, (match, bracket, tag) => {
      return `${bracket}<span class="text-blue-600 dark:text-blue-400">${tag}</span>`; // tags
    })
    .replace(/([a-zA-Z0-9_-]+)=&quot;([^&quot;]*)&quot;/g, (match, attr, value) => {
      return `<span class="text-purple-600 dark:text-purple-400">${attr}</span>=&quot;<span class="text-green-600 dark:text-green-400">${value}</span>&quot;`; // attributes
    });
}

function highlightJavaScript(code: string): string {
  const keywords = new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class',
    'extends', 'import', 'export', 'from', 'async', 'await', 'try', 'catch',
    'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'delete', 'void',
  ]);
  const builtins = new Set([
    'console', 'Math', 'JSON', 'Array', 'Object', 'String', 'Number',
    'Boolean', 'Date', 'Promise', 'Map', 'Set',
  ]);
  const literals = new Set(['true', 'false', 'null', 'undefined']);

  // Single-pass tokenizer: tokenize raw code, build result with escaped segments
  const rawTokenRegex = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|=>|\b\d+\.?\d*(?:[eE][+-]?\d+)?\b|\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;

  let result = '';
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = rawTokenRegex.exec(code)) !== null) {
    // Append escaped text between tokens
    if (match.index > lastIndex) {
      result += escapeHtml(code.slice(lastIndex, match.index));
    }

    const token = match[0];
    const escapedToken = escapeHtml(token);

    if (token.startsWith('//') || token.startsWith('/*')) {
      // Comment
      result += `<span class="text-gray-500 dark:text-gray-500">${escapedToken}</span>`;
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      // String
      result += `<span class="text-green-600 dark:text-green-400">${escapedToken}</span>`;
    } else if (token === '=>') {
      // Arrow
      result += `<span class="text-purple-600 dark:text-purple-400">${escapedToken}</span>`;
    } else if (/^\d/.test(token)) {
      // Number
      result += `<span class="text-orange-600 dark:text-orange-400">${escapedToken}</span>`;
    } else if (keywords.has(token)) {
      // Keyword
      result += `<span class="text-purple-600 dark:text-purple-400">${escapedToken}</span>`;
    } else if (literals.has(token)) {
      // Literal (true, false, null, undefined)
      result += `<span class="text-purple-600 dark:text-purple-400">${escapedToken}</span>`;
    } else if (builtins.has(token)) {
      // Built-in object
      result += `<span class="text-cyan-600 dark:text-cyan-400">${escapedToken}</span>`;
    } else {
      // Check if this is a function call (followed by '(')
      const afterToken = code.slice(match.index + token.length);
      if (/^\s*\(/.test(afterToken)) {
        result += `<span class="text-blue-600 dark:text-blue-400">${escapedToken}</span>`;
      } else {
        // Check if preceded by a dot (property access)
        const beforeToken = code.slice(Math.max(0, match.index - 1), match.index);
        if (beforeToken === '.') {
          result += `<span class="text-blue-500 dark:text-blue-300">${escapedToken}</span>`;
        } else {
          result += escapedToken;
        }
      }
    }

    lastIndex = match.index + token.length;
  }

  // Append remaining text
  if (lastIndex < code.length) {
    result += escapeHtml(code.slice(lastIndex));
  }

  return result;
}
