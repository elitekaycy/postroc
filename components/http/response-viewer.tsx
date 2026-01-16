'use client';

import type { HttpResponse } from '@/lib/types/core';
import { getStatusColor, formatDuration, formatBytes } from '@/lib/http/http-client';
import { Copy, Download, Check } from 'lucide-react';
import { useState } from 'react';

interface ResponseViewerProps {
  response: HttpResponse | null;
  isLoading?: boolean;
}

type Tab = 'body' | 'headers' | 'info';

export function ResponseViewer({ response, isLoading }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('body');
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="border border-[var(--border)] rounded-lg p-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500">Sending request...</span>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="border border-[var(--border)] rounded-lg p-8 text-center text-gray-500">
        <p>No response yet. Send a request to see the response.</p>
      </div>
    );
  }

  const statusColor = getStatusColor(response.status);
  const statusColorClass = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  }[statusColor];

  const bodyString = typeof response.body === 'string'
    ? response.body
    : JSON.stringify(response.body, null, 2);

  const bodySize = new Blob([bodyString]).size;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bodyString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([bodyString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--sidebar-bg)]">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded text-sm font-medium ${statusColorClass}`}>
            {response.status} {response.statusText}
          </span>
          <span className="text-sm text-gray-500">
            {formatDuration(response.duration)}
          </span>
          <span className="text-sm text-gray-500">
            {formatBytes(bodySize)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-[var(--hover)] rounded"
            title="Copy response"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-[var(--hover)] rounded"
            title="Download response"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {response.error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{response.error}</p>
        </div>
      )}

      <div className="border-b border-[var(--border)]">
        <div className="flex gap-1 px-4 pt-2">
          {(['body', 'headers', 'info'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium capitalize rounded-t transition-colors ${
                activeTab === tab
                  ? 'bg-[var(--background)] border border-b-0 border-[var(--border)]'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-auto">
        {activeTab === 'body' && (
          <pre className="text-sm font-mono whitespace-pre-wrap break-words">
            {bodyString || '(empty response)'}
          </pre>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-2">
            {Object.entries(response.headers).length === 0 ? (
              <p className="text-gray-500 text-sm">No headers</p>
            ) : (
              Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>
                  <span className="text-gray-600 dark:text-gray-400 break-all">{value}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
              <span>{response.status} {response.statusText}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Duration:</span>
              <span>{formatDuration(response.duration)}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Size:</span>
              <span>{formatBytes(bodySize)}</span>
            </div>
            {response.error && (
              <div className="flex gap-2">
                <span className="font-medium text-red-600">Error:</span>
                <span className="text-red-600">{response.error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
