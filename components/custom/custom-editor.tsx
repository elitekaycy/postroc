'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import type { HttpMethod, HttpResponse, FieldType } from '@/lib/types/core';
import { sendRequest } from '@/lib/http/http-client';
import { sendRawRequest } from '@/lib/http/http-client';
import { buildRequestHeaders, buildFullUrl } from '@/lib/http/request-builder';
import { ResponseViewer } from '@/components/http/response-viewer';
import { ReferenceSelector } from '@/components/custom/reference-selector';
import { DataPreviewPanel } from '@/components/custom/data-preview-panel';
import { Trash2, Plus, Play, Download } from 'lucide-react';
import { useState } from 'react';

interface CustomEditorProps {
  customId: string;
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const FIELD_TYPES: FieldType[] = ['string', 'number', 'boolean', 'array', 'object', 'reference', 'api-fetch'];

export function CustomEditor({ customId }: CustomEditorProps) {
  const {
    getActiveCustom,
    getActiveCategory,
    updateCustom,
    addField,
    updateField,
    deleteField,
    populateFieldsFromResponse,
  } = useWorkspaceStore();

  const custom = getActiveCustom();
  const category = getActiveCategory();

  const [response, setResponse] = useState<HttpResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

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
          className="h-8 px-3 text-xs border border-[var(--border)] rounded hover:bg-[var(--hover)] disabled:opacity-40 transition-colors"
          title="Fetch and populate fields"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleSendRequest}
          disabled={isLoading}
          className="h-8 px-3 text-xs border border-[var(--border)] rounded hover:bg-[var(--hover)] disabled:opacity-40 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Left - Fields */}
        <div className="w-1/2 flex flex-col min-h-0">
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
                  <div key={field.id} className="flex items-center gap-1.5 py-1">
                    <input
                      type="checkbox"
                      checked={field.isExported}
                      onChange={(e) => updateField(customId, field.id, { isExported: e.target.checked })}
                      className="w-3 h-3"
                    />

                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => updateField(customId, field.id, { key: e.target.value })}
                      placeholder="key"
                      className="w-24 h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
                    />

                    <select
                      value={field.type}
                      onChange={(e) => updateField(customId, field.id, { type: e.target.value as FieldType })}
                      className="h-6 px-1 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
                    >
                      {FIELD_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>

                    <div className="flex-1">
                      {field.type === 'reference' ? (
                        <ReferenceSelector
                          currentCustomId={customId}
                          value={field.referenceId}
                          onChange={(referenceId) => updateField(customId, field.id, { referenceId })}
                        />
                      ) : field.type === 'api-fetch' ? (
                        <input
                          type="text"
                          value={field.apiEndpoint || ''}
                          onChange={(e) => updateField(customId, field.id, { apiEndpoint: e.target.value })}
                          placeholder="/api/data"
                          className="w-full h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(field.value ?? '')}
                          onChange={(e) => updateField(customId, field.id, { value: e.target.value })}
                          placeholder="value"
                          className="w-full h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
                        />
                      )}
                    </div>

                    <button
                      onClick={() => deleteField(customId, field.id)}
                      className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
