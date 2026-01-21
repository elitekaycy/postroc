import type { Field, FieldType } from '@/lib/types/core';

/**
 * Infers a FieldType from a JavaScript value
 */
export function inferFieldType(value: unknown): FieldType {
  if (value === null || value === undefined) {
    return 'string';
  }

  if (typeof value === 'string') {
    return 'string';
  }

  if (typeof value === 'number') {
    return 'number';
  }

  if (typeof value === 'boolean') {
    return 'boolean';
  }

  if (Array.isArray(value)) {
    return 'array';
  }

  if (typeof value === 'object') {
    return 'object';
  }

  return 'string';
}

/**
 * Recursively creates Field definitions from a value.
 * Handles nested objects and arrays with full data preservation.
 */
export function createFieldFromValue(
  key: string,
  value: unknown
): Omit<Field, 'id'> {
  const type = inferFieldType(value);

  const field: Omit<Field, 'id'> = {
    key,
    type,
    value,
    isExported: true,
  };

  // Handle nested objects - create children from object keys
  if (type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    const children: Omit<Field, 'id'>[] = [];
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      children.push(createFieldFromValue(childKey, childValue));
    }
    if (children.length > 0) {
      field.children = children as Field[];
    }
  }

  // Handle arrays - create children structure from first item (template)
  // but keep full array as value
  if (type === 'array' && Array.isArray(value) && value.length > 0) {
    const firstItem = value[0];
    if (firstItem && typeof firstItem === 'object' && !Array.isArray(firstItem)) {
      // Array of objects - create children from first item structure
      const children: Omit<Field, 'id'>[] = [];
      for (const [childKey, childValue] of Object.entries(firstItem as Record<string, unknown>)) {
        children.push(createFieldFromValue(childKey, childValue));
      }
      if (children.length > 0) {
        field.children = children as Field[];
      }
    }
  }

  return field;
}

/**
 * Converts a JSON object into an array of Field definitions.
 * Recursively processes nested objects and arrays.
 */
export function populateFieldsFromObject(
  data: Record<string, unknown>
): Omit<Field, 'id'>[] {
  const fields: Omit<Field, 'id'>[] = [];

  for (const [key, value] of Object.entries(data)) {
    fields.push(createFieldFromValue(key, value));
  }

  return fields;
}

/**
 * Merges new fields with existing fields.
 * Skips fields where the key already exists in existingFields.
 * Returns the merged array with existing fields first, then new unique fields.
 */
export function mergeFieldsWithExisting(
  existingFields: Field[],
  newFields: Omit<Field, 'id'>[]
): Omit<Field, 'id'>[] {
  const existingKeys = new Set(existingFields.map((f) => f.key));

  // Filter out new fields that already exist
  const uniqueNewFields = newFields.filter((f) => !existingKeys.has(f.key));

  return uniqueNewFields;
}

/**
 * Extracts fields from an API response.
 * Now preserves full array data instead of only first item.
 */
export function extractFieldsFromResponse(response: unknown): Record<string, unknown> {
  if (!response || typeof response !== 'object') {
    return {};
  }

  const data = response as Record<string, unknown>;

  // Common API response patterns - check for nested data
  if ('data' in data && typeof data.data === 'object' && data.data !== null) {
    // Return the full data object or array
    return { data: data.data };
  }

  // Check for results pattern
  if ('results' in data && Array.isArray(data.results)) {
    return { results: data.results };
  }

  // Check for items pattern
  if ('items' in data && Array.isArray(data.items)) {
    return { items: data.items };
  }

  // If it's an array at root, wrap it in a 'data' key to preserve full array
  if (Array.isArray(response)) {
    return { data: response };
  }

  // Otherwise use the response directly
  return data;
}
