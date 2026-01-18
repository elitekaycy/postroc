'use client';

interface SyntaxHighlighterProps {
  code: string;
  language: 'json' | 'xml' | 'text';
}

export function SyntaxHighlighter({ code, language }: SyntaxHighlighterProps) {
  if (language === 'text') {
    return <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">{code}</pre>;
  }

  const highlighted = language === 'json' ? highlightJSON(code) : highlightXML(code);

  return (
    <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
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
