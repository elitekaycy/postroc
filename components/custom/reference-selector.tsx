'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { wouldCreateCycle, buildDependencyGraph } from '@/lib/engine/dependency-resolver';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ReferenceSelectorProps {
  currentCustomId: string;
  value: string | undefined;
  onChange: (referenceId: string) => void;
}

export function ReferenceSelector({ currentCustomId, value, onChange }: ReferenceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { workspaces, activeCategoryId } = useWorkspaceStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allCustoms: Array<{ id: string; name: string; categoryName: string; categoryId: string; projectId: string }> = [];

  for (const workspace of workspaces) {
    for (const project of workspace.projects) {
      // Add project-level customs (no category)
      for (const custom of project.customs) {
        if (custom.id !== currentCustomId) {
          allCustoms.push({
            id: custom.id,
            name: custom.name,
            categoryName: project.name,
            categoryId: '',
            projectId: project.id,
          });
        }
      }
      // Add category-level customs
      for (const category of project.categories) {
        for (const custom of category.customs) {
          if (custom.id !== currentCustomId) {
            allCustoms.push({
              id: custom.id,
              name: custom.name,
              categoryName: category.name,
              categoryId: category.id,
              projectId: project.id,
            });
          }
        }
      }
    }
  }

  const categoryCustoms = allCustoms.filter((c) => c.categoryId === activeCategoryId);
  const otherCustoms = allCustoms.filter((c) => c.categoryId !== activeCategoryId);

  const filterCustoms = (customs: typeof allCustoms) =>
    customs.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.categoryName.toLowerCase().includes(search.toLowerCase())
    );

  const filteredCategoryCustoms = filterCustoms(categoryCustoms);
  const filteredOtherCustoms = filterCustoms(otherCustoms);

  const getAllCustomsForCycleCheck = () => {
    const customs: Array<{ id: string; fields: Array<{ type: string; referenceId?: string }> }> = [];
    for (const workspace of workspaces) {
      for (const project of workspace.projects) {
        // Project-level customs
        for (const custom of project.customs) {
          customs.push({ id: custom.id, fields: custom.fields });
        }
        // Category-level customs
        for (const category of project.categories) {
          for (const custom of category.customs) {
            customs.push({ id: custom.id, fields: custom.fields });
          }
        }
      }
    }
    return customs;
  };

  const checkCycle = (targetId: string): boolean => {
    const allCustomsForCheck = getAllCustomsForCycleCheck();
    if (allCustomsForCheck.length === 0) return false;

    const graph = buildDependencyGraph(allCustomsForCheck as any);
    return wouldCreateCycle(currentCustomId, targetId, graph);
  };

  const selectedCustom = allCustoms.find((c) => c.id === value);

  const handleSelect = (customId: string) => {
    onChange(customId);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-left"
      >
        <span className={selectedCustom ? '' : 'text-gray-500'}>
          {selectedCustom ? selectedCustom.name : 'Select reference...'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--background)] border border-[var(--border)] rounded-md shadow-lg z-50 max-h-64 overflow-hidden">
          <div className="p-2 border-b border-[var(--border)]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customs..."
              className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
              autoFocus
            />
          </div>

          <div className="overflow-auto max-h-48">
            {filteredCategoryCustoms.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-[var(--sidebar-bg)]">
                  Current Category
                </div>
                {filteredCategoryCustoms.map((custom) => {
                  const wouldCycle = checkCycle(custom.id);
                  return (
                    <button
                      key={custom.id}
                      onClick={() => !wouldCycle && handleSelect(custom.id)}
                      disabled={wouldCycle}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--hover)] ${
                        wouldCycle ? 'opacity-50 cursor-not-allowed' : ''
                      } ${value === custom.id ? 'bg-[var(--hover)]' : ''}`}
                    >
                      <span className="flex-1">{custom.name}</span>
                      {wouldCycle && (
                        <span className="flex items-center gap-1 text-xs text-yellow-600">
                          <AlertTriangle className="w-3 h-3" />
                          Cycle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {filteredOtherCustoms.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-[var(--sidebar-bg)]">
                  Other Customs
                </div>
                {filteredOtherCustoms.map((custom) => {
                  const wouldCycle = checkCycle(custom.id);
                  return (
                    <button
                      key={custom.id}
                      onClick={() => !wouldCycle && handleSelect(custom.id)}
                      disabled={wouldCycle}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--hover)] ${
                        wouldCycle ? 'opacity-50 cursor-not-allowed' : ''
                      } ${value === custom.id ? 'bg-[var(--hover)]' : ''}`}
                    >
                      <span className="flex-1">{custom.name}</span>
                      {wouldCycle ? (
                        <span className="flex items-center gap-1 text-xs text-yellow-600">
                          <AlertTriangle className="w-3 h-3" />
                          Cycle
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">{custom.categoryName}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {filteredCategoryCustoms.length === 0 && filteredOtherCustoms.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No customs found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
