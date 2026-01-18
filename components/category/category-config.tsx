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
    <div className="max-w-xl space-y-8">
      {/* Name */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-400">Name</label>
        <input
          type="text"
          value={category.name}
          onChange={(e) => updateCategory(categoryId, { name: e.target.value })}
          className="mt-1 w-full h-8 px-2 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
        />
      </div>

      {/* Environments */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-400">Environments</label>
        <div className="mt-2 space-y-2">
          {config.environments.map((env) => (
            <div key={env.name} className="flex items-center gap-2">
              <input
                type="radio"
                checked={config.activeEnvironment === env.name}
                onChange={() => setActiveEnvironment(categoryId, env.name)}
                className="w-3 h-3"
              />
              <span className="w-20 text-xs capitalize">{env.name}</span>
              <input
                type="text"
                value={env.baseUrl}
                onChange={(e) => updateEnvironment(categoryId, env.name, { baseUrl: e.target.value })}
                placeholder="https://api.example.com"
                className="flex-1 h-7 px-2 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Authentication */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-400">Auth</label>
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
          className="mt-1 w-full h-8 px-2 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
        >
          <option value="none">None</option>
          <option value="bearer">Bearer Token</option>
          <option value="api-key">API Key</option>
          <option value="basic">Basic Auth</option>
        </select>

        {config.auth.type === 'bearer' && (
          <input
            type="password"
            value={config.auth.token || ''}
            onChange={(e) => updateAuth(categoryId, { token: e.target.value })}
            placeholder="Token"
            className="mt-2 w-full h-7 px-2 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
          />
        )}

        {config.auth.type === 'api-key' && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={config.auth.apiKeyHeader || ''}
              onChange={(e) => updateAuth(categoryId, { apiKeyHeader: e.target.value })}
              placeholder="Header"
              className="flex-1 h-7 px-2 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
            />
            <input
              type="password"
              value={config.auth.apiKeyValue || ''}
              onChange={(e) => updateAuth(categoryId, { apiKeyValue: e.target.value })}
              placeholder="Value"
              className="flex-1 h-7 px-2 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
            />
          </div>
        )}

        {config.auth.type === 'basic' && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={config.auth.username || ''}
              onChange={(e) => updateAuth(categoryId, { username: e.target.value })}
              placeholder="Username"
              className="flex-1 h-7 px-2 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
            />
            <input
              type="password"
              value={config.auth.password || ''}
              onChange={(e) => updateAuth(categoryId, { password: e.target.value })}
              placeholder="Password"
              className="flex-1 h-7 px-2 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
            />
          </div>
        )}
      </div>

      {/* Headers */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-400">Headers</label>
        <div className="mt-2 space-y-1">
          {config.defaultHeaders.map((header) => (
            <div key={header.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={header.enabled}
                onChange={(e) => updateHeader(categoryId, header.id, { enabled: e.target.checked })}
                className="w-3 h-3"
              />
              <input
                type="text"
                value={header.key}
                onChange={(e) => updateHeader(categoryId, header.id, { key: e.target.value })}
                placeholder="Key"
                className="w-32 h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
              />
              <input
                type="text"
                value={header.value}
                onChange={(e) => updateHeader(categoryId, header.id, { value: e.target.value })}
                placeholder="Value"
                className="flex-1 h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
              />
              <button
                onClick={() => deleteHeader(categoryId, header.id)}
                className="p-0.5 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-1">
            <div className="w-3" />
            <input
              type="text"
              value={newHeaderKey}
              onChange={(e) => setNewHeaderKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHeader()}
              placeholder="Key"
              className="w-32 h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
            />
            <input
              type="text"
              value={newHeaderValue}
              onChange={(e) => setNewHeaderValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHeader()}
              placeholder="Value"
              className="flex-1 h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
            />
            <button onClick={handleAddHeader} className="p-0.5 text-gray-400 hover:text-gray-600">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
