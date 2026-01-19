'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import type { HttpMethod, HttpResponse } from '@/lib/types/core';
import { sendRequest } from '@/lib/http/http-client';
import { sendRawRequest } from '@/lib/http/http-client';
import { buildRequestHeaders, buildFullUrl } from '@/lib/http/request-builder';
import { ResponseViewer } from '@/components/http/response-viewer';
import { FieldEditor } from '@/components/custom/field-editor';
import { DataPreviewPanel } from '@/components/custom/data-preview-panel';
import { ExportConfigPanel } from '@/components/custom/export-config-panel';
import { Plus, Play, Download } from 'lucide-react';
import type { ExportConfig } from '@/lib/types/core';
import { useState, useEffect } from 'react';

interface CustomEditorProps {
  customId: string;
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export function CustomEditor({ customId }: CustomEditorProps) {
  const {
    getActiveCustom,
    getActiveCategory,
    updateCustom,
    addField,
    populateFieldsFromResponse,
  } = useWorkspaceStore();

  const custom = getActiveCustom();
  const category = getActiveCategory();

  const [response, setResponse] = useState<HttpResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Reset response when switching customs
  useEffect(() => {
    setResponse(null);
  }, [customId]);

  if (!custom || custom.id !== customId) {
    return null;
  }

  const handleSendRequest = async () => {
    setIsLoading(true);
    try {
      const result = await sendRequest(custom, category);
      setResponse(result);
    } catch (error) {
      setResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: null,
        duration: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchAndPopulate = async () => {
    if (!custom.requestConfig?.endpoint) return;

    setIsFetching(true);
    try {
      const url = buildFullUrl(category, custom.requestConfig.endpoint);
      const headers = buildRequestHeaders(custom, category);
      const method = custom.requestConfig.method || 'GET';

      const result = await sendRawRequest(url, method, headers);

      if (result.body && typeof result.body === 'object' && !result.error) {
        populateFieldsFromResponse(customId, result.body as Record<string, unknown>);
      }

      setResponse(result);
    } catch (error) {
      setResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: null,
        duration: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddField = () => {
    addField(customId, {
      key: `field_${custom.fields.length + 1}`,
      type: 'string',
      isExported: true,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendRequest();
    }
  };

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      {/* Request Bar */}
      <div className="flex items-center gap-2 pb-4">
        <select
          value={custom.requestConfig?.method || 'GET'}
          onChange={(e) =>
            updateCustom(customId, {
              requestConfig: {
                ...custom.requestConfig,
                method: e.target.value as HttpMethod,
                endpoint: custom.requestConfig?.endpoint || '',
              },
            })
          }
          className="h-8 px-2 text-xs font-medium border border-[var(--border)] rounded bg-[var(--background)]"
        >
          {HTTP_METHODS.map((method) => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>

        <input
          type="text"
          value={custom.requestConfig?.endpoint || ''}
          onChange={(e) =>
            updateCustom(customId, {
              requestConfig: {
                ...custom.requestConfig,
                method: custom.requestConfig?.method || 'GET',
                endpoint: e.target.value,
              },
            })
          }
          placeholder="https://api.example.com/endpoint"
          className="flex-1 h-8 px-2 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
        />

        <button
          onClick={handleFetchAndPopulate}
          disabled={isFetching || !custom.requestConfig?.endpoint}
          className="h-8 px-3 text-xs border border-[var(--border)] rounded hover:bg-[var(--hover)] disabled:opacity-40 transition-colors flex items-center gap-1.5"
        >
          <Download className="w-3 h-3" />
          <span>{isFetching ? 'Fetching...' : 'Fetch'}</span>
        </button>

        <button
          onClick={handleSendRequest}
          disabled={isLoading}
          className="h-8 px-3 text-xs border border-[var(--border)] rounded hover:bg-[var(--hover)] disabled:opacity-40 transition-colors flex items-center gap-1.5"
        >
          <Play className="w-3 h-3" />
          <span>{isLoading ? 'Sending...' : 'Send'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Left - Fields */}
        <div className="w-1/2 flex flex-col min-h-0 gap-3">
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Fields</span>
              <button
                onClick={handleAddField}
                className="p-1 hover:bg-[var(--hover)] rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {custom.fields.length === 0 ? (
                <div className="text-xs text-gray-400 py-8 text-center">
                  No fields
                </div>
              ) : (
                <div className="space-y-1">
                  {custom.fields.map((field) => (
                    <FieldEditor
                      key={field.id}
                      customId={customId}
                      field={field}
                      fieldPath={[field.id]}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export Config */}
          <ExportConfigPanel
            config={custom.exportConfig}
            fieldKeys={custom.fields.filter((f) => f.isExported).map((f) => f.key)}
            onChange={(config: ExportConfig | undefined) => updateCustom(customId, { exportConfig: config })}
          />
        </div>

        {/* Right - Preview & Response */}
        <div className="w-1/2 flex flex-col min-h-0 gap-4">
          <DataPreviewPanel custom={custom} category={category} />

          {response && (
            <div className="flex-1 min-h-0 overflow-auto">
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Response</span>
              <div className="mt-2">
                <ResponseViewer response={response} isLoading={isLoading} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
