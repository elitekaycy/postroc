'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface EditableTextProps {
  value: string;
  isEditing: boolean;
  onSave: (value: string) => void;
  onCancel: () => void;
  className?: string;
}

export function EditableText({
  value,
  isEditing,
  onSave,
  onCancel,
  className = '',
}: EditableTextProps) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editValue.trim()) {
        onSave(editValue.trim());
      } else {
        onCancel();
      }
    } else if (e.key === 'Escape') {
      setEditValue(value);
      onCancel();
    }
  };

  const handleBlur = () => {
    if (editValue.trim()) {
      onSave(editValue.trim());
    } else {
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`bg-transparent border border-blue-500 rounded px-1 outline-none ${className}`}
      />
    );
  }

  return <span className={`truncate ${className}`}>{value}</span>;
}
