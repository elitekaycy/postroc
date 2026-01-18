'use client';

import type { Custom, Category } from '@/lib/types/core';
import { generatePreviewData, resolveSingleCustom, ResolvedData } from '@/lib/engine/data-resolver';
import { exportData, copyToClipboard, ExportFormat } from '@/lib/export/exporters';
import { Copy, Check } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

interface DataPreviewPanelProps {
  custom: Custom;
  category?: Category | null;
}

export function DataPreviewPanel({ custom, category }: DataPreviewPanelProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});
  const [resolvedData, setResolvedData] = useState<ResolvedData | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [copied, setCopied] = useState(false);

  const regeneratePreview = useCallback(() => {
    setPreviewData(generatePreviewData(custom));
    setResolvedData(null);
  }, [custom]);

  useEffect(() => {
    regeneratePreview();
  }, [regeneratePreview]);

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      const result = await resolveSingleCustom(custom, category);
      setResolvedData(result);
    } catch {
      // Silent fail
    } finally {
      setIsResolving(false);
    }
  };

  const currentData = resolvedData ? resolvedData.data : previewData;
  const formattedData = exportData(currentData, { format: exportFormat });

  const handleCopy = async () => {
    await copyToClipboard(currentData, { format: exportFormat });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-gray-400">Preview</span>
        <div className="flex items-center gap-1">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            className="h-5 px-1 text-[10px] border border-[var(--border)] rounded bg-[var(--background)]"
          >
            <option value="json">JSON</option>
            <option value="xml">XML</option>
          </select>
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="h-5 px-1.5 text-[10px] border border-[var(--border)] rounded hover:bg-[var(--hover)] disabled:opacity-40"
          >
            {isResolving ? '...' : 'Resolve'}
          </button>
          <button
            onClick={handleCopy}
            className="p-0.5 hover:bg-[var(--hover)] rounded"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto border border-[var(--border)] rounded bg-[var(--sidebar-bg)]">
        <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">
          {formattedData || '{}'}
        </pre>
      </div>
    </div>
  );
}
