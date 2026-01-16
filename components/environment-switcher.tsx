'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import type { Environment } from '@/lib/types/core';
import { ChevronDown, Circle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface EnvironmentSwitcherProps {
  categoryId?: string;
}

export function EnvironmentSwitcher({ categoryId }: EnvironmentSwitcherProps) {
  const { getActiveCategory, setActiveEnvironment, activeCategoryId } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const targetCategoryId = categoryId || activeCategoryId;
  const category = getActiveCategory();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!category || (categoryId && category.id !== categoryId)) {
    return null;
  }

  const { config } = category;

  const getEnvironmentColor = (env: Environment): string => {
    switch (env) {
      case 'local':
        return 'text-green-500';
      case 'staging':
        return 'text-yellow-500';
      case 'production':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getEnvironmentBgColor = (env: Environment): string => {
    switch (env) {
      case 'local':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'staging':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'production':
        return 'bg-red-100 dark:bg-red-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const activeEnv = config.environments.find((e) => e.name === config.activeEnvironment);

  const handleSelect = (env: Environment) => {
    if (targetCategoryId) {
      setActiveEnvironment(targetCategoryId, env);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${getEnvironmentBgColor(
          config.activeEnvironment
        )}`}
      >
        <Circle className={`w-2.5 h-2.5 fill-current ${getEnvironmentColor(config.activeEnvironment)}`} />
        <span className="capitalize">{config.activeEnvironment}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--background)] border border-[var(--border)] rounded-md shadow-lg z-50 overflow-hidden">
          {config.environments.map((env) => (
            <button
              key={env.name}
              onClick={() => handleSelect(env.name)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-[var(--hover)] transition-colors ${
                config.activeEnvironment === env.name ? 'bg-[var(--hover)]' : ''
              }`}
            >
              <Circle
                className={`w-2.5 h-2.5 mt-1.5 fill-current flex-shrink-0 ${getEnvironmentColor(env.name)}`}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium capitalize text-sm">{env.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {env.baseUrl || 'No URL configured'}
                </div>
              </div>
              {config.activeEnvironment === env.name && (
                <span className="text-xs text-blue-600 dark:text-blue-400 flex-shrink-0">Active</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
