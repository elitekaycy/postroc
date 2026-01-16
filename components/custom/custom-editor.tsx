'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import type { HttpMethod, HttpResponse, FieldType } from '@/lib/types/core';
import { sendRequest } from '@/lib/http/http-client';
import { sendRawRequest } from '@/lib/http/http-client';
import { buildRequestHeaders, getBaseUrl, buildFullUrl } from '@/lib/http/request-builder';
import { ResponseViewer } from '@/components/http/response-viewer';
import { ReferenceSelector } from '@/components/custom/reference-selector';
import { DataPreviewPanel } from '@/components/custom/data-preview-panel';
import { Trash2, Plus, Play, Download, Loader2 } from 'lucide-react';
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

      if (result.error) {
        setResponse({
          ...result,
          body: { error: result.error },
        });
        return;
      }

      // Populate fields from response
      if (result.body && typeof result.body === 'object') {
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
      <div className="flex-shrink-0 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <select
            value={custom.requestConfig?.method || 'GET'}
            onChange={(e) =>
              updateCustom(customId, {
                requestConfig: {
                  ...custom.requestConfig,
                  method: e.target.value as HttpMethod,
                  endpoint: custom.requestConfig?.endpoint || '/',
                },
              })
            }
            className="px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] font-medium text-sm"
          >
            {HTTP_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
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
            placeholder="/api/endpoint"
            className="flex-1 px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
          />

          <button
            onClick={handleFetchAndPopulate}
            disabled={isFetching || !custom.requestConfig?.endpoint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm font-medium"
            title="Fetch endpoint and populate fields from response"
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Fetch
          </button>

          <button
            onClick={handleSendRequest}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md text-sm font-medium"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Send
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Use {'{{fieldName}}'} for path variables. Press Ctrl+Enter to send. Click Fetch to populate fields from response.
        </p>
      </div>

      {/* Main Content - Side by Side */}
      <div className="flex-1 flex gap-6 pt-4 min-h-0 overflow-hidden">
        {/* Left Panel - Fields */}
        <div className="w-1/2 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Fields</h3>
            <button
              onClick={handleAddField}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          <div className="flex-1 overflow-auto pr-2">
            {custom.fields.length === 0 ? (
              <div className="text-gray-500 text-sm py-8 text-center border border-dashed border-[var(--border)] rounded-lg">
                <p>No fields yet.</p>
                <p className="mt-1">Add a field or use Fetch to populate from an endpoint.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {custom.fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-2 p-2.5 border border-[var(--border)] rounded-md bg-[var(--sidebar-bg)]"
                  >
                    <input
                      type="checkbox"
                      checked={field.isExported}
                      onChange={(e) => updateField(customId, field.id, { isExported: e.target.checked })}
                      className="mt-2 w-3.5 h-3.5 cursor-pointer"
                      title="Include in request"
                    />

                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => updateField(customId, field.id, { key: e.target.value })}
                        placeholder="Key"
                        className="px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
                      />

                      <select
                        value={field.type}
                        onChange={(e) => updateField(customId, field.id, { type: e.target.value as FieldType })}
                        className="px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
                      >
                        {FIELD_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>

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
                          className="px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(field.value ?? '')}
                          onChange={(e) => updateField(customId, field.id, { value: e.target.value })}
                          placeholder="Value (optional)"
                          className="px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
                        />
                      )}
                    </div>

                    <button
                      onClick={() => deleteField(customId, field.id)}
                      className="mt-1 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview & Response */}
        <div className="w-1/2 flex flex-col min-h-0 gap-4">
          <div className="flex-shrink-0">
            <DataPreviewPanel custom={custom} category={category} />
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Response</h3>
            <ResponseViewer response={response} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
