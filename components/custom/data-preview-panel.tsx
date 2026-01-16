'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import type { Custom, Category } from '@/lib/types/core';
import { generatePreviewData, resolveSingleCustom, ResolvedData } from '@/lib/engine/data-resolver';
import { RefreshCw, Play, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

interface DataPreviewPanelProps {
  custom: Custom;
  category: Category;
}

type PreviewMode = 'generated' | 'resolved';
type ExportFormat = 'json' | 'xml' | 'form-data' | 'url-encoded';

export function DataPreviewPanel({ custom, category }: DataPreviewPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('generated');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});
  const [resolvedData, setResolvedData] = useState<ResolvedData | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const regeneratePreview = useCallback(() => {
    setPreviewData(generatePreviewData(custom));
    setResolvedData(null);
    setResolveError(null);
  }, [custom]);

  useEffect(() => {
    regeneratePreview();
  }, [regeneratePreview]);

  const handleResolve = async () => {
    setIsResolving(true);
    setResolveError(null);
    try {
      const result = await resolveSingleCustom(custom, category);
      setResolvedData(result);
      setPreviewMode('resolved');
    } catch (error) {
      setResolveError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsResolving(false);
    }
  };

  const currentData = previewMode === 'resolved' && resolvedData
    ? resolvedData.data
    : previewData;

  const formatData = (data: Record<string, unknown>, format: ExportFormat): string => {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);

      case 'xml':
        return toXml(data);

      case 'form-data':
        return toFormData(data);

      case 'url-encoded':
        return toUrlEncoded(data);

      default:
        return JSON.stringify(data, null, 2);
    }
  };

  return (
    <section>
      <div
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Data Preview</h3>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded"
          >
            <Play className="w-3 h-3" />
            {isResolving ? 'Resolving...' : 'Resolve'}
          </button>
          <button
            onClick={regeneratePreview}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--sidebar-bg)]">
            <div className="flex gap-1">
              <button
                onClick={() => setPreviewMode('generated')}
                className={`px-3 py-1 text-sm rounded ${
                  previewMode === 'generated'
                    ? 'bg-[var(--background)] font-medium'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Generated
              </button>
              <button
                onClick={() => setPreviewMode('resolved')}
                disabled={!resolvedData}
                className={`px-3 py-1 text-sm rounded ${
                  previewMode === 'resolved'
                    ? 'bg-[var(--background)] font-medium'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50'
                }`}
              >
                Resolved
              </button>
            </div>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              className="px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
            >
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="form-data">Form Data</option>
              <option value="url-encoded">URL Encoded</option>
            </select>
          </div>

          {resolveError && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700 dark:text-red-400">{resolveError}</span>
            </div>
          )}

          {resolvedData && resolvedData.errors.length > 0 && (
            <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                Resolution warnings:
              </p>
              <ul className="text-sm text-yellow-600 dark:text-yellow-500 list-disc list-inside">
                {resolvedData.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <pre className="p-4 text-sm font-mono overflow-auto max-h-64 whitespace-pre-wrap break-words">
            {formatData(currentData, exportFormat)}
          </pre>
        </div>
      )}
    </section>
  );
}

function toXml(data: Record<string, unknown>, rootName = 'root'): string {
  const escapeXml = (str: string): string =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const convert = (value: unknown, key: string): string => {
    if (value === null || value === undefined) {
      return `<${key}/>`;
    }

    if (Array.isArray(value)) {
      return value.map((item, i) => convert(item, `item`)).join('\n');
    }

    if (typeof value === 'object') {
      const inner = Object.entries(value as Record<string, unknown>)
        .map(([k, v]) => convert(v, k))
        .join('\n');
      return `<${key}>\n${inner}\n</${key}>`;
    }

    return `<${key}>${escapeXml(String(value))}</${key}>`;
  };

  const inner = Object.entries(data)
    .map(([k, v]) => convert(v, k))
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${inner}\n</${rootName}>`;
}

function toFormData(data: Record<string, unknown>): string {
  const lines: string[] = [];

  const flatten = (obj: unknown, prefix = ''): void => {
    if (obj === null || obj === undefined) {
      lines.push(`${prefix}: (empty)`);
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, i) => flatten(item, `${prefix}[${i}]`));
      return;
    }

    if (typeof obj === 'object') {
      Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
        flatten(v, prefix ? `${prefix}[${k}]` : k);
      });
      return;
    }

    lines.push(`${prefix}: ${String(obj)}`);
  };

  flatten(data);
  return lines.join('\n');
}

function toUrlEncoded(data: Record<string, unknown>): string {
  const pairs: string[] = [];

  const flatten = (obj: unknown, prefix = ''): void => {
    if (obj === null || obj === undefined) {
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, i) => flatten(item, `${prefix}[${i}]`));
      return;
    }

    if (typeof obj === 'object') {
      Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
        flatten(v, prefix ? `${prefix}[${k}]` : k);
      });
      return;
    }

    pairs.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(obj))}`);
  };

  flatten(data);
  return pairs.join('&');
}
