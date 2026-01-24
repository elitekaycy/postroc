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
      field.value = undefined; // Clear raw value so generation uses children
    }
  }

  // Handle arrays - detect if items are mixed types, objects, or uniform
  if (type === 'array' && Array.isArray(value) && value.length > 0) {
    // Detect types of all items
    const itemTypes = new Set(value.map((item) => {
      if (item === null || item === undefined) return 'null';
      if (Array.isArray(item)) return 'array';
      return typeof item;
    }));

    // Remove 'null' from consideration for type detection
    itemTypes.delete('null');

    const hasMultipleTypes = itemTypes.size > 1;
    const allObjects = itemTypes.size === 1 && itemTypes.has('object');
    const allStrings = itemTypes.size === 1 && itemTypes.has('string');
    const allNumbers = itemTypes.size === 1 && itemTypes.has('number');
    const allBooleans = itemTypes.size === 1 && itemTypes.has('boolean');

    if (hasMultipleTypes) {
      // Mixed array - each item is a separate child with its own type
      field.arrayItemType = 'mixed';
      field.value = undefined; // Don't store raw value for mixed arrays
      const children: Omit<Field, 'id'>[] = [];
      value.forEach((item, index) => {
        const child = createFieldFromValue(`[${index}]`, item);
        children.push(child);
      });
      field.children = children as Field[];
    } else if (allObjects) {
      // Array of objects - create children from first item structure
      field.arrayItemType = 'object';
      field.arrayCount = value.length;
      field.value = undefined;
      const firstItem = value[0];
      const children: Omit<Field, 'id'>[] = [];
      for (const [childKey, childValue] of Object.entries(firstItem as Record<string, unknown>)) {
        children.push(createFieldFromValue(childKey, childValue));
      }
      if (children.length > 0) {
        field.children = children as Field[];
      }
    } else if (allNumbers) {
      field.arrayItemType = 'number';
      field.arrayCount = value.length;
      field.value = value.join(', ');
    } else if (allBooleans) {
      field.arrayItemType = 'boolean';
      field.arrayCount = value.length;
      field.value = value.map(String).join(', ');
    } else if (allStrings) {
      field.arrayItemType = 'string';
      field.arrayCount = value.length;
      field.value = (value as string[]).join(', ');
    } else {
      // Default to string
      field.arrayItemType = 'string';
      field.arrayCount = value.length;
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
