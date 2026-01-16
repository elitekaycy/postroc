'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import type { HttpMethod, HttpResponse, FieldType } from '@/lib/types/core';
import { sendRequest } from '@/lib/http/http-client';
import { ResponseViewer } from '@/components/http/response-viewer';
import { ReferenceSelector } from '@/components/custom/reference-selector';
import { DataPreviewPanel } from '@/components/custom/data-preview-panel';
import { Trash2, Plus, Play } from 'lucide-react';
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
  } = useWorkspaceStore();

  const custom = getActiveCustom();
  const category = getActiveCategory();

  const [response, setResponse] = useState<HttpResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!custom || custom.id !== customId || !category) {
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
    <div className="space-y-6" onKeyDown={handleKeyDown}>
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Request Configuration</h3>
          <button
            onClick={handleSendRequest}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md text-sm font-medium"
          >
            <Play className="w-4 h-4" />
            Send
          </button>
        </div>

        <div className="flex gap-3">
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
            className="px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] font-medium"
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
            className="flex-1 px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
          />
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Use {'{{fieldName}}'} for path variables. Press Ctrl+Enter to send.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Fields</h3>
          <button
            onClick={handleAddField}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>

        {custom.fields.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No fields yet. Add a field to start building your request.</p>
        ) : (
          <div className="space-y-3">
            {custom.fields.map((field) => (
              <div key={field.id} className="flex items-start gap-3 p-3 border border-[var(--border)] rounded-md">
                <input
                  type="checkbox"
                  checked={field.isExported}
                  onChange={(e) => updateField(customId, field.id, { isExported: e.target.checked })}
                  className="mt-2.5 w-4 h-4 cursor-pointer"
                  title="Include in request"
                />

                <div className="flex-1 grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) => updateField(customId, field.id, { key: e.target.value })}
                    placeholder="Key"
                    className="px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
                  />

                  <select
                    value={field.type}
                    onChange={(e) => updateField(customId, field.id, { type: e.target.value as FieldType })}
                    className="px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
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
                      className="px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(field.value || '')}
                      onChange={(e) => updateField(customId, field.id, { value: e.target.value })}
                      placeholder="Value (optional)"
                      className="px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
                    />
                  )}
                </div>

                <button
                  onClick={() => deleteField(customId, field.id)}
                  className="mt-1 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <DataPreviewPanel custom={custom} category={category} />

      <section>
        <h3 className="text-lg font-semibold mb-4">Response</h3>
        <ResponseViewer response={response} isLoading={isLoading} />
      </section>
    </div>
  );
}
