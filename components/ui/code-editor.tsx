'use client';

import { useRef, useEffect, useState } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Simple JavaScript syntax highlighter
function highlightCode(code: string): string {
  const keywords = [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class',
    'extends', 'import', 'export', 'from', 'async', 'await', 'try', 'catch',
    'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'delete', 'void',
  ];
  const builtins = ['console', 'Math', 'JSON', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'Promise', 'Map', 'Set', 'data'];

  let result = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  result = result.replace(/(\/\/[^\n]*)/g, '<span class="text-gray-500">$1</span>');

  // Strings
  result = result.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span class="text-green-500">$1</span>');

  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-500">$1</span>');

  // Keywords
  const keywordPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  result = result.replace(keywordPattern, '<span class="text-purple-500">$1</span>');

  // Booleans and null/undefined
  result = result.replace(/\b(true|false|null|undefined)\b/g, '<span class="text-purple-500">$1</span>');

  // Built-ins and data variable
  const builtinPattern = new RegExp(`\\b(${builtins.join('|')})\\b`, 'g');
  result = result.replace(builtinPattern, '<span class="text-cyan-500">$1</span>');

  // Function calls
  result = result.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, '<span class="text-blue-500">$1</span>(');

  // Arrow functions
  result = result.replace(/=&gt;/g, '<span class="text-purple-500">=&gt;</span>');

  // Property access
  result = result.replace(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '.<span class="text-blue-400">$1</span>');

  return result;
}

export function CodeEditor({ value, onChange, placeholder, className = '' }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Sync scroll between textarea and pre
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
    }
  }, [scrollTop]);

  // Handle tab key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      // Set cursor position after tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const highlighted = highlightCode(value || '');

  return (
    <div className={`relative font-mono text-xs ${className}`}>
      {/* Highlighted code (display layer) */}
      <pre
        ref={preRef}
        className="absolute inset-0 p-2 overflow-hidden pointer-events-none whitespace-pre-wrap break-words leading-relaxed"
        aria-hidden="true"
      >
        <code dangerouslySetInnerHTML={{ __html: highlighted || `<span class="text-gray-400">${placeholder || ''}</span>` }} />
      </pre>

      {/* Textarea (input layer) */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        className="relative w-full h-full p-2 bg-transparent text-transparent caret-[var(--foreground)] resize-none outline-none whitespace-pre-wrap break-words leading-relaxed placeholder:text-gray-400"
        style={{ caretColor: 'var(--foreground)' }}
      />
    </div>
  );
}
