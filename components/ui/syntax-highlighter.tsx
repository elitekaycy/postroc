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
  const keywords = [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class',
    'extends', 'import', 'export', 'from', 'async', 'await', 'try', 'catch',
    'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'delete', 'void',
  ];
  const builtins = ['console', 'Math', 'JSON', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'Promise', 'Map', 'Set'];

  let result = escapeHtml(code);

  // Comments (single line)
  result = result.replace(/(\/\/[^\n]*)/g, '<span class="text-gray-500 dark:text-gray-500">$1</span>');

  // Strings (double and single quotes, template literals)
  result = result.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span class="text-green-600 dark:text-green-400">$1</span>');

  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-600 dark:text-orange-400">$1</span>');

  // Keywords
  const keywordPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  result = result.replace(keywordPattern, '<span class="text-purple-600 dark:text-purple-400">$1</span>');

  // Booleans and null/undefined
  result = result.replace(/\b(true|false|null|undefined)\b/g, '<span class="text-purple-600 dark:text-purple-400">$1</span>');

  // Built-in objects
  const builtinPattern = new RegExp(`\\b(${builtins.join('|')})\\b`, 'g');
  result = result.replace(builtinPattern, '<span class="text-cyan-600 dark:text-cyan-400">$1</span>');

  // Function calls and method calls
  result = result.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, '<span class="text-blue-600 dark:text-blue-400">$1</span>(');

  // Arrow functions
  result = result.replace(/=&gt;/g, '<span class="text-purple-600 dark:text-purple-400">=&gt;</span>');

  // Property access (dot notation)
  result = result.replace(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '.<span class="text-blue-500 dark:text-blue-300">$1</span>');

  return result;
}
