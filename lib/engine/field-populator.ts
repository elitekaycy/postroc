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
 * Converts a JSON object into an array of Field definitions.
 * Only processes top-level keys.
 */
export function populateFieldsFromObject(
  data: Record<string, unknown>
): Omit<Field, 'id'>[] {
  const fields: Omit<Field, 'id'>[] = [];

  for (const [key, value] of Object.entries(data)) {
    const type = inferFieldType(value);

    fields.push({
      key,
      type,
      value: value,
      isExported: true,
    });
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
 * Handles both direct objects and nested data patterns.
 */
export function extractFieldsFromResponse(response: unknown): Record<string, unknown> {
  if (!response || typeof response !== 'object') {
    return {};
  }

  const data = response as Record<string, unknown>;

  // Common API response patterns - check for nested data
  if ('data' in data && typeof data.data === 'object' && data.data !== null) {
    // If data is an array, use the first item as template
    if (Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0] as Record<string, unknown>;
    }
    return data.data as Record<string, unknown>;
  }

  // Check for results/items pattern
  if ('results' in data && Array.isArray(data.results) && data.results.length > 0) {
    return data.results[0] as Record<string, unknown>;
  }

  if ('items' in data && Array.isArray(data.items) && data.items.length > 0) {
    return data.items[0] as Record<string, unknown>;
  }

  // If it's an array at root, use first item
  if (Array.isArray(response) && response.length > 0) {
    return response[0] as Record<string, unknown>;
  }

  // Otherwise use the response directly
  return data;
}
