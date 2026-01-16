'use client';

import { Modal } from '@/components/ui/modal';
import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { useState, useEffect } from 'react';

type EntityType = 'workspace' | 'project' | 'category' | 'custom';

interface EntityModalProps {
  type: EntityType;
  isOpen: boolean;
  onClose: () => void;
  parentId?: string;
  editId?: string;
}

export function EntityModal({ type, isOpen, onClose, parentId, editId }: EntityModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const {
    workspaces,
    createWorkspace,
    updateWorkspace,
    createProject,
    updateProject,
    createCategory,
    updateCategory,
    createCustom,
    updateCustom,
  } = useWorkspaceStore();

  const isEdit = Boolean(editId);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      return;
    }

    if (isEdit && editId) {
      const entity = findEntity(type, editId);
      if (entity) {
        setName(entity.name);
        if ('description' in entity) {
          setDescription(entity.description || '');
        }
      }
    }
  }, [isOpen, isEdit, editId, type]);

  const findEntity = (entityType: EntityType, id: string) => {
    for (const workspace of workspaces) {
      if (entityType === 'workspace' && workspace.id === id) {
        return workspace;
      }
      for (const project of workspace.projects) {
        if (entityType === 'project' && project.id === id) {
          return project;
        }
        for (const category of project.categories) {
          if (entityType === 'category' && category.id === id) {
            return category;
          }
          for (const custom of category.customs) {
            if (entityType === 'custom' && custom.id === id) {
              return custom;
            }
          }
        }
      }
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const data = { name: name.trim(), description: description.trim() || undefined };

    if (isEdit && editId) {
      switch (type) {
        case 'workspace':
          updateWorkspace(editId, data);
          break;
        case 'project':
          updateProject(editId, data);
          break;
        case 'category':
          updateCategory(editId, data);
          break;
        case 'custom':
          updateCustom(editId, data);
          break;
      }
    } else if (parentId) {
      switch (type) {
        case 'workspace':
          createWorkspace(name.trim());
          break;
        case 'project':
          createProject(parentId, name.trim());
          break;
        case 'category':
          createCategory(parentId, name.trim());
          break;
        case 'custom':
          createCustom(parentId, name.trim());
          break;
      }
    } else if (type === 'workspace') {
      createWorkspace(name.trim());
    }

    onClose();
  };

  const getTitle = () => {
    const action = isEdit ? 'Edit' : 'New';
    const entityName = type.charAt(0).toUpperCase() + type.slice(1);
    return `${action} ${entityName}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[var(--hover)] rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="entity-form"
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded"
          >
            {isEdit ? 'Save' : 'Create'}
          </button>
        </>
      }
    >
      <form id="entity-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Enter ${type} name`}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
            autoFocus
          />
        </div>

        {(type === 'workspace' || type === 'project' || type === 'category') && (
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] resize-none"
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityType: EntityType;
  entityName: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  entityType,
  entityName,
}: DeleteConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${entityType}?`}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[var(--hover)] rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded"
          >
            Delete
          </button>
        </>
      }
    >
      <p className="text-gray-600 dark:text-gray-400">
        Are you sure you want to delete <strong>{entityName}</strong>? This action cannot be undone.
      </p>
      {(entityType === 'workspace' || entityType === 'project' || entityType === 'category') && (
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          All nested items will also be deleted.
        </p>
      )}
    </Modal>
  );
}
