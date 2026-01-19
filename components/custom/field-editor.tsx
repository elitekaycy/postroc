'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import type { Field, FieldType, ArrayItemType } from '@/lib/types/core';
import { ReferenceSelector } from '@/components/custom/reference-selector';
import { Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const FIELD_TYPES: FieldType[] = ['string', 'number', 'boolean', 'array', 'object', 'reference', 'api-fetch'];
const ARRAY_ITEM_TYPES: ArrayItemType[] = ['string', 'number', 'boolean', 'object'];

interface FieldEditorProps {
  customId: string;
  field: Field;
  fieldPath: string[];
  depth?: number;
}

export function FieldEditor({ customId, field, fieldPath, depth = 0 }: FieldEditorProps) {
  const { updateField, deleteField, addNestedField, updateNestedField, deleteNestedField } = useWorkspaceStore();
  const [isExpanded, setIsExpanded] = useState(true);

  // For arrays, only show children if arrayItemType is 'object'
  const isObjectArray = field.type === 'array' && field.arrayItemType === 'object';
  const hasChildren = field.type === 'object' || isObjectArray;
  const canHaveChildren = hasChildren;

  const handleUpdate = (updates: Partial<Field>) => {
    if (depth === 0) {
      updateField(customId, field.id, updates);
    } else {
      updateNestedField(customId, fieldPath, updates);
    }
  };

  const handleDelete = () => {
    if (depth === 0) {
      deleteField(customId, field.id);
    } else {
      deleteNestedField(customId, fieldPath);
    }
  };

  const handleAddChild = () => {
    const childField: Omit<Field, 'id'> = {
      key: field.type === 'array' ? 'item' : `field_${(field.children?.length || 0) + 1}`,
      type: 'string',
      isExported: true,
    };
    addNestedField(customId, field.id, childField);
    setIsExpanded(true);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 py-1" style={{ paddingLeft: `${depth * 16}px` }}>
        {canHaveChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}

        {!canHaveChildren && <div className="w-4" />}

        <input
          type="checkbox"
          checked={field.isExported}
          onChange={(e) => handleUpdate({ isExported: e.target.checked })}
          className="w-3 h-3"
          title="Export this field"
        />

        <input
          type="text"
          value={field.key}
          onChange={(e) => handleUpdate({ key: e.target.value })}
          placeholder="key"
          className="w-24 h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
        />

        <select
          value={field.type}
          onChange={(e) => {
            const newType = e.target.value as FieldType;
            handleUpdate({ type: newType });
          }}
          className="h-6 px-1 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
        >
          {FIELD_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <div className="flex-1">
          {field.type === 'reference' ? (
            <div className="flex gap-1">
              <ReferenceSelector
                currentCustomId={customId}
                value={field.referenceId}
                onChange={(referenceId) => handleUpdate({ referenceId })}
              />
              <input
                type="text"
                value={field.referenceKey || ''}
                onChange={(e) => handleUpdate({ referenceKey: e.target.value })}
                placeholder="key (optional)"
                className="w-24 h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
                title="Specific key to extract from reference"
              />
            </div>
          ) : field.type === 'api-fetch' ? (
            <input
              type="text"
              value={field.apiEndpoint || ''}
              onChange={(e) => handleUpdate({ apiEndpoint: e.target.value })}
              placeholder="/api/data"
              className="w-full h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
            />
          ) : field.type === 'array' ? (
            <div className="flex items-center gap-1.5">
              <select
                value={field.arrayItemType || 'string'}
                onChange={(e) => handleUpdate({ arrayItemType: e.target.value as ArrayItemType })}
                className="h-6 px-1 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
                title="Item type"
              >
                {ARRAY_ITEM_TYPES.map((type) => (
                  <option key={type} value={type}>{type}[]</option>
                ))}
              </select>
              <input
                type="number"
                value={field.arrayCount ?? 3}
                onChange={(e) => handleUpdate({ arrayCount: parseInt(e.target.value) || 1 })}
                min={1}
                max={100}
                className="w-12 h-6 px-1 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-center"
                title="Number of items"
              />
              {field.arrayItemType === 'object' && (
                <button
                  onClick={handleAddChild}
                  className="p-0.5 hover:bg-[var(--hover)] rounded transition-colors"
                  title="Add object property"
                >
                  <Plus className="w-3 h-3 text-[var(--muted)]" />
                </button>
              )}
            </div>
          ) : field.type === 'object' ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--muted)]">
                {field.children?.length || 0} properties
              </span>
              <button
                onClick={handleAddChild}
                className="p-0.5 hover:bg-[var(--hover)] rounded transition-colors"
                title="Add property"
              >
                <Plus className="w-3 h-3 text-[var(--muted)]" />
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={String(field.value ?? '')}
              onChange={(e) => handleUpdate({ value: e.target.value })}
              placeholder="value"
              className="w-full h-6 px-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
            />
          )}
        </div>

        <button
          onClick={handleDelete}
          className="p-0.5 text-[var(--muted)] hover:text-red-500 transition-colors"
          title="Delete field"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Nested children */}
      {canHaveChildren && isExpanded && field.children && field.children.length > 0 && (
        <div className="border-l border-[var(--border)] ml-2">
          {field.children.map((child) => (
            <FieldEditor
              key={child.id}
              customId={customId}
              field={child}
              fieldPath={[...fieldPath, child.id]}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
