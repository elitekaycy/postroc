'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import type { Environment } from '@/lib/types/core';
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
    return (
      <div className="text-xs text-gray-400">
        No environment
      </div>
    );
  }

  const { config } = category;

  const getEnvStyles = (env: Environment, isActive: boolean) => {
    const baseClasses = isActive
      ? 'ring-2 ring-offset-1 ring-offset-[var(--background)]'
      : 'hover:opacity-80';

    switch (env) {
      case 'local':
        return `bg-emerald-500 ${baseClasses} ${isActive ? 'ring-emerald-500' : ''}`;
      case 'staging':
        return `bg-amber-500 ${baseClasses} ${isActive ? 'ring-amber-500' : ''}`;
      case 'production':
        return `bg-rose-500 ${baseClasses} ${isActive ? 'ring-rose-500' : ''}`;
      default:
        return `bg-gray-400 ${baseClasses}`;
    }
  };

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
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--hover)] transition-colors"
      >
        <div className={`w-2 h-2 rounded-full ${getEnvStyles(config.activeEnvironment, false).split(' ')[0]}`} />
        <span className="text-xs font-medium capitalize">{config.activeEnvironment}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 p-1 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-50 min-w-[160px]">
          {config.environments.map((env) => (
            <button
              key={env.name}
              onClick={() => handleSelect(env.name)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                config.activeEnvironment === env.name
                  ? 'bg-[var(--hover)]'
                  : 'hover:bg-[var(--hover)]'
              }`}
            >
              <div className={`w-2 h-2 rounded-full transition-all ${getEnvStyles(env.name, config.activeEnvironment === env.name)}`} />
              <div className="flex-1">
                <span className="text-xs font-medium capitalize">{env.name}</span>
              </div>
              {config.activeEnvironment === env.name && (
                <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
