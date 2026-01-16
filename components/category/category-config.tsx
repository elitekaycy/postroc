'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import type { AuthType, Environment } from '@/lib/types/core';
import { Trash2, Plus } from 'lucide-react';
import { useState } from 'react';

interface CategoryConfigProps {
  categoryId: string;
}

export function CategoryConfig({ categoryId }: CategoryConfigProps) {
  const {
    getActiveCategory,
    updateCategory,
    updateCategoryConfig,
    setActiveEnvironment,
    updateEnvironment,
    updateAuth,
    addHeader,
    updateHeader,
    deleteHeader,
  } = useWorkspaceStore();

  const category = getActiveCategory();
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  if (!category || category.id !== categoryId) {
    return null;
  }

  const { config } = category;

  const handleAddHeader = () => {
    if (newHeaderKey.trim() && newHeaderValue.trim()) {
      addHeader(categoryId, {
        key: newHeaderKey.trim(),
        value: newHeaderValue.trim(),
        enabled: true,
      });
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold mb-4">Basic Info</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={category.name}
              onChange={(e) => updateCategory(categoryId, { name: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--background)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={category.description || ''}
              onChange={(e) => updateCategory(categoryId, { description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--background)]"
              placeholder="Optional description for this category"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Environments</h3>
        <div className="space-y-3">
          {config.environments.map((env) => (
            <div key={env.name} className="flex items-center gap-3">
              <input
                type="radio"
                checked={config.activeEnvironment === env.name}
                onChange={() => setActiveEnvironment(categoryId, env.name)}
                className="w-4 h-4 cursor-pointer"
              />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 capitalize">
                    {env.name}
                  </label>
                </div>
                <div>
                  <input
                    type="text"
                    value={env.baseUrl}
                    onChange={(e) =>
                      updateEnvironment(categoryId, env.name, { baseUrl: e.target.value })
                    }
                    placeholder={`https://${env.name}.example.com`}
                    className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--background)]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Authentication</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={config.auth.type}
              onChange={(e) =>
                updateAuth(categoryId, {
                  type: e.target.value as AuthType,
                  token: undefined,
                  apiKeyHeader: undefined,
                  apiKeyValue: undefined,
                  username: undefined,
                  password: undefined,
                })
              }
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--background)]"
            >
              <option value="none">None</option>
              <option value="bearer">Bearer Token</option>
              <option value="api-key">API Key</option>
              <option value="basic">Basic Auth</option>
            </select>
          </div>

          {config.auth.type === 'bearer' && (
            <div>
              <label className="block text-sm font-medium mb-1">Token</label>
              <input
                type="password"
                value={config.auth.token || ''}
                onChange={(e) => updateAuth(categoryId, { token: e.target.value })}
                placeholder="Bearer token"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--background)]"
              />
            </div>
          )}

          {config.auth.type === 'api-key' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Header Name</label>
                <input
                  type="text"
                  value={config.auth.apiKeyHeader || ''}
                  onChange={(e) => updateAuth(categoryId, { apiKeyHeader: e.target.value })}
                  placeholder="X-API-Key"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--background)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <input
                  type="password"
                  value={config.auth.apiKeyValue || ''}
                  onChange={(e) => updateAuth(categoryId, { apiKeyValue: e.target.value })}
                  placeholder="API key value"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--background)]"
                />
              </div>
            </div>
          )}

          {config.auth.type === 'basic' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={config.auth.username || ''}
                  onChange={(e) => updateAuth(categoryId, { username: e.target.value })}
                  placeholder="Username"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--background)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={config.auth.password || ''}
                  onChange={(e) => updateAuth(categoryId, { password: e.target.value })}
                  placeholder="Password"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--background)]"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Default Headers</h3>
        <div className="space-y-3">
          {config.defaultHeaders.map((header) => (
            <div key={header.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={header.enabled}
                onChange={(e) =>
                  updateHeader(categoryId, header.id, { enabled: e.target.checked })
                }
                className="w-4 h-4 cursor-pointer"
              />
              <input
                type="text"
                value={header.key}
                onChange={(e) => updateHeader(categoryId, header.id, { key: e.target.value })}
                placeholder="Header name"
                className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--background)]"
              />
              <input
                type="text"
                value={header.value}
                onChange={(e) => updateHeader(categoryId, header.id, { value: e.target.value })}
                placeholder="Value"
                className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--background)]"
              />
              <button
                onClick={() => deleteHeader(categoryId, header.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Delete header"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-2">
            <div className="w-4" />
            <input
              type="text"
              value={newHeaderKey}
              onChange={(e) => setNewHeaderKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHeader()}
              placeholder="Header name"
              className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--background)]"
            />
            <input
              type="text"
              value={newHeaderValue}
              onChange={(e) => setNewHeaderValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHeader()}
              placeholder="Value"
              className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--background)]"
            />
            <button
              onClick={handleAddHeader}
              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              title="Add header"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
