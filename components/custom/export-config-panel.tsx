'use client';

import type { ExportConfig, ExportAsType } from '@/lib/types/core';
import { validateTransformCode } from '@/lib/engine/export-transform';
import { CodeEditor } from '@/components/ui/code-editor';
import { ChevronDown, ChevronRight, Code, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ExportConfigPanelProps {
  config?: ExportConfig;
  fieldKeys: string[];
  onChange: (config: ExportConfig | undefined) => void;
}

const EXPORT_TYPES: { value: ExportAsType; label: string; description: string }[] = [
  { value: 'full', label: 'Full Object', description: 'Export all fields as an object' },
  { value: 'field', label: 'Single Field', description: 'Export a specific field value' },
  { value: 'array', label: 'Array Extract', description: 'Extract a field from array items' },
  { value: 'transform', label: 'Transform', description: 'Custom code transformation' },
];

export function ExportConfigPanel({ config, fieldKeys, onChange }: ExportConfigPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const currentType = config?.type || 'full';

  useEffect(() => {
    if (config?.type === 'transform' && config.transformCode) {
      const result = validateTransformCode(config.transformCode);
      setCodeError(result.valid ? null : result.error || 'Invalid code');
    } else {
      setCodeError(null);
    }
  }, [config]);

  const handleTypeChange = (type: ExportAsType) => {
    if (type === 'full') {
      onChange(undefined);
    } else {
      // Create fresh config for the new type, preserving only relevant fields
      const newConfig: ExportConfig = { type };
      if (type === 'field' && config?.fieldPath) {
        newConfig.fieldPath = config.fieldPath;
      } else if (type === 'array' && config?.arrayField) {
        newConfig.arrayField = config.arrayField;
      } else if (type === 'transform' && config?.transformCode) {
        newConfig.transformCode = config.transformCode;
      }
      onChange(newConfig);
    }
  };

  const handleFieldPathChange = (fieldPath: string) => {
    onChange({ type: 'field', fieldPath });
  };

  const handleArrayFieldChange = (arrayField: string) => {
    onChange({ type: 'array', arrayField });
  };

  const handleTransformCodeChange = (transformCode: string) => {
    onChange({ type: 'transform', transformCode });
  };

  return (
    <div className="border border-[var(--border)] rounded">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[var(--hover)] transition-colors"
      >
        <div className="flex items-center gap-1.5">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-[var(--muted)]" />
          ) : (
            <ChevronRight className="w-3 h-3 text-[var(--muted)]" />
          )}
          <span className="text-[10px] uppercase tracking-wider text-gray-400">Export As</span>
        </div>
        <span className="text-[10px] text-[var(--muted)]">
          {EXPORT_TYPES.find((t) => t.value === currentType)?.label || 'Full Object'}
        </span>
      </button>

      {isExpanded && (
        <div className="px-2 pb-2 space-y-2 border-t border-[var(--border)]">
          <div className="pt-2">
            <select
              value={currentType}
              onChange={(e) => handleTypeChange(e.target.value as ExportAsType)}
              className="w-full h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
            >
              {EXPORT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          {currentType === 'field' && (
            <div>
              <label className="text-[10px] text-[var(--muted)] mb-1 block">Field Path</label>
              <select
                value={config?.fieldPath || ''}
                onChange={(e) => handleFieldPathChange(e.target.value)}
                className="w-full h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
              >
                <option value="">Select a field...</option>
                {fieldKeys.map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
              <input
                type="text"
                value={config?.fieldPath || ''}
                onChange={(e) => handleFieldPathChange(e.target.value)}
                placeholder="Or enter path (e.g., data.user.id)"
                className="w-full h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] mt-1"
              />
            </div>
          )}

          {currentType === 'array' && (
            <div>
              <label className="text-[10px] text-[var(--muted)] mb-1 block">Array Field to Extract</label>
              <input
                type="text"
                value={config?.arrayField || ''}
                onChange={(e) => handleArrayFieldChange(e.target.value)}
                placeholder="e.g., data.id (extracts 'id' from each item in 'data' array)"
                className="w-full h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
              />
              <p className="text-[9px] text-[var(--muted)] mt-1">
                Extracts the specified field from each array item. Use dot notation (e.g., items.id).
              </p>
            </div>
          )}

          {currentType === 'transform' && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Code className="w-3 h-3 text-[var(--muted)]" />
                <label className="text-[10px] text-[var(--muted)]">Transform Code</label>
              </div>
              <div className="h-28 border border-[var(--border)] rounded bg-[var(--background)] overflow-hidden">
                <CodeEditor
                  value={config?.transformCode || ''}
                  onChange={handleTransformCodeChange}
                  placeholder="data"
                  className="h-full"
                />
              </div>
              {codeError && (
                <div className="flex items-center gap-1 mt-1 text-red-500">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-[9px]">{codeError}</span>
                </div>
              )}
              <div className="mt-2 text-[9px] text-[var(--muted)] space-y-1.5 bg-[var(--sidebar-bg)] p-2 rounded border border-[var(--border)]">
                <p className="font-medium text-[var(--foreground)]">Examples (use `data` variable):</p>
                <div className="space-y-1 font-mono">
                  <p><span className="text-purple-500">// Return single field</span></p>
                  <p className="pl-2">data.userId</p>
                  <p><span className="text-purple-500">// Extract IDs from array</span></p>
                  <p className="pl-2">data.items.map(i =&gt; i.id)</p>
                  <p><span className="text-purple-500">// Filter + transform</span></p>
                  <p className="pl-2">data.users.filter(u =&gt; u.active).map(u =&gt; u.email)</p>
                  <p><span className="text-purple-500">// Pick specific fields</span></p>
                  <p className="pl-2">{`({ id: data.id, name: data.name })`}</p>
                  <p><span className="text-purple-500">// Join array to string</span></p>
                  <p className="pl-2">data.tags.join(", ")</p>
                  <p><span className="text-purple-500">// Get first item</span></p>
                  <p className="pl-2">data.results[0]</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
