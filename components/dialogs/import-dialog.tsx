'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { useWorkspaceStore } from '@/lib/store/workspace-store';
import {
  validateImport,
  getImportStats,
  readFileAsText,
  type ImportMode,
} from '@/lib/export/workspace-import';
import type { PostrocExport } from '@/lib/export/workspace-export';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportDialog({ isOpen, onClose }: ImportDialogProps) {
  const { importFromJSON } = useWorkspaceStore();

  const [importMode, setImportMode] = useState<ImportMode>('import-as-new');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<PostrocExport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setParsedData(null);
    setImportResult(null);

    try {
      const content = await readFileAsText(selectedFile);
      setFileContent(content);

      const validation = validateImport(content);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      setParsedData(validation.data!);
    } catch (e) {
      setError('Failed to read file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.json')) {
      handleFileSelect(droppedFile);
    } else {
      setError('Please drop a .json file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleImport = () => {
    if (!fileContent) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = importFromJSON(fileContent, importMode);

      if (result.success) {
        const stats = result.stats;
        let message = 'Import successful!';
        if (stats) {
          const parts: string[] = [];
          if (stats.workspaces > 0) parts.push(`${stats.workspaces} workspace(s)`);
          if (stats.projects > 0) parts.push(`${stats.projects} project(s)`);
          if (stats.categories > 0) parts.push(`${stats.categories} category(ies)`);
          if (stats.customs > 0) parts.push(`${stats.customs} custom(s)`);
          if (parts.length > 0) {
            message = `Imported ${parts.join(', ')}`;
          }
        }
        setImportResult({ success: true, message });

        // Close dialog after a short delay on success
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setImportResult({ success: false, message: result.error || 'Import failed' });
      }
    } catch (e) {
      setImportResult({ success: false, message: 'Import failed unexpectedly' });
    } finally {
      setIsImporting(false);
    }
  };

  const stats = parsedData ? getImportStats(parsedData) : null;

  const resetState = () => {
    setFile(null);
    setFileContent(null);
    setParsedData(null);
    setError(null);
    setImportResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-medium">Import</h2>
          <button onClick={handleClose} className="p-1 hover:bg-[var(--hover)] rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* File Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              error
                ? 'border-red-400 bg-red-50/5'
                : parsedData
                ? 'border-green-400 bg-green-50/5'
                : 'border-[var(--border)] hover:border-blue-400 hover:bg-blue-50/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {!file ? (
              <>
                <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--muted)]" />
                <p className="text-xs text-[var(--muted)]">
                  Drop a .postroc.json file here or click to browse
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <FileJson className={`w-5 h-5 ${error ? 'text-red-400' : 'text-green-400'}`} />
                <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50/10 border border-red-400/30 rounded text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">{error}</span>
            </div>
          )}

          {/* Preview */}
          {parsedData && stats && (
            <div className="p-3 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded">
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">Preview</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Type:</span>
                  <span className="font-medium capitalize">{parsedData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Name:</span>
                  <span className="font-medium truncate ml-2">
                    {(parsedData.data as { name?: string }).name || 'Unnamed'}
                  </span>
                </div>
                {stats.workspaces > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Workspaces:</span>
                    <span>{stats.workspaces}</span>
                  </div>
                )}
                {stats.projects > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Projects:</span>
                    <span>{stats.projects}</span>
                  </div>
                )}
                {stats.categories > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Categories:</span>
                    <span>{stats.categories}</span>
                  </div>
                )}
                {stats.customs > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Customs:</span>
                    <span>{stats.customs}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Mode */}
          {parsedData && (
            <div>
              <label className="text-xs text-[var(--muted)] mb-2 block">Import mode</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2 border border-[var(--border)] rounded cursor-pointer hover:bg-[var(--hover)]">
                  <input
                    type="radio"
                    name="importMode"
                    value="import-as-new"
                    checked={importMode === 'import-as-new'}
                    onChange={() => setImportMode('import-as-new')}
                    className="w-3 h-3"
                  />
                  <div>
                    <span className="text-xs font-medium">Import as new</span>
                    <p className="text-[10px] text-[var(--muted)]">Keep existing data, add imported data</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 border border-[var(--border)] rounded cursor-pointer hover:bg-[var(--hover)]">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="w-3 h-3"
                  />
                  <div>
                    <span className="text-xs font-medium">Merge</span>
                    <p className="text-[10px] text-[var(--muted)]">Add to current workspace/project</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 border border-[var(--border)] rounded cursor-pointer hover:bg-[var(--hover)]">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="w-3 h-3"
                  />
                  <div>
                    <span className="text-xs font-medium">Replace all</span>
                    <p className="text-[10px] text-[var(--muted)]">Clear existing data first</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div
              className={`flex items-center gap-2 p-2 rounded ${
                importResult.success
                  ? 'bg-green-50/10 border border-green-400/30 text-green-400'
                  : 'bg-red-50/10 border border-red-400/30 text-red-400'
              }`}
            >
              {importResult.success ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-xs">{importResult.message}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded hover:bg-[var(--hover)]"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!parsedData || isImporting || !!importResult?.success}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Upload className="w-3 h-3" />
              {isImporting ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
