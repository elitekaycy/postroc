'use client';

import type { Custom, Category } from '@/lib/types/core';
import { generatePreviewData, resolveSingleCustom, ResolvedData } from '@/lib/engine/data-resolver';
import { exportData, downloadExport, copyToClipboard, ExportFormat } from '@/lib/export/exporters';
import { RefreshCw, Play, ChevronDown, ChevronUp, AlertCircle, Copy, Download, Check } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

interface DataPreviewPanelProps {
  custom: Custom;
  category: Category;
}

type PreviewMode = 'generated' | 'resolved';

export function DataPreviewPanel({ custom, category }: DataPreviewPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('generated');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});
  const [resolvedData, setResolvedData] = useState<ResolvedData | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    await copyToClipboard(currentData, { format: exportFormat });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${custom.name}-${previewMode}`;
    downloadExport(currentData, filename, { format: exportFormat });
  };

  const formattedData = exportData(currentData, { format: exportFormat });

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
            <div className="flex items-center gap-2">
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
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-[var(--hover)] rounded"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleDownload}
                className="p-1.5 hover:bg-[var(--hover)] rounded"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
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
            {formattedData}
          </pre>
        </div>
      )}
    </section>
  );
}
