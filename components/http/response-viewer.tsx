'use client';

import type { HttpResponse } from '@/lib/types/core';
import { getStatusColor, formatDuration } from '@/lib/http/http-client';
import { SyntaxHighlighter } from '@/components/ui/syntax-highlighter';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ResponseViewerProps {
  response: HttpResponse | null;
  isLoading?: boolean;
}

export function ResponseViewer({ response, isLoading }: ResponseViewerProps) {
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="text-xs text-gray-400 py-4 text-center">
        Sending...
      </div>
    );
  }

  if (!response) {
    return null;
  }

  const statusColor = getStatusColor(response.status);
  const statusDot = {
    green: 'bg-green-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
    gray: 'bg-gray-400',
  }[statusColor];

  const isJSON = typeof response.body === 'object' && response.body !== null;
  const bodyString = isJSON
    ? JSON.stringify(response.body, null, 2)
    : String(response.body || '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bodyString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border border-[var(--border)] rounded overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[var(--border)] bg-[var(--sidebar-bg)]">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          <span className="text-[10px] text-gray-500">
            {response.status} · {formatDuration(response.duration)}
          </span>
        </div>
        <button onClick={handleCopy} className="p-0.5 hover:bg-[var(--hover)] rounded">
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3 text-gray-400" />
          )}
        </button>
      </div>

      {response.error && (
        <div className="px-2 py-1.5 text-[10px] text-red-500 bg-red-50 dark:bg-red-900/10 border-b border-[var(--border)]">
          {response.error}
        </div>
      )}

      <div className="max-h-48 overflow-auto">
        <SyntaxHighlighter
          code={bodyString || '(empty)'}
          language={isJSON ? 'json' : 'text'}
        />
      </div>
    </div>
  );
}
