import type { ExportConfig } from '@/lib/types/core';

/**
 * Applies export configuration to transform data
 */
export function applyExportConfig(
  data: Record<string, unknown>,
  config?: ExportConfig
): unknown {
  // Default to full export if no config
  if (!config || config.type === 'full') {
    return data;
  }

  switch (config.type) {
    case 'field':
      return extractField(data, config.fieldPath);

    case 'array':
      return extractArrayField(data, config.arrayField);

    case 'transform':
      return runTransform(data, config.transformCode);

    default:
      return data;
  }
}

/**
 * Extracts a specific field from data using dot notation
 */
function extractField(data: Record<string, unknown>, fieldPath?: string): unknown {
  if (!fieldPath) return data;

  const keys = fieldPath.split('.');
  let value: unknown = data;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }

  return value;
}

/**
 * Extracts a field from each item in an array
 */
function extractArrayField(
  data: Record<string, unknown>,
  arrayField?: string
): unknown {
  if (!arrayField) return data;

  // Find the first array in the data
  let sourceArray: unknown[] | null = null;
  let extractKey: string = arrayField;

  // Check if the path includes a specific array key (e.g., "data.id" where data is the array)
  const parts = arrayField.split('.');
  if (parts.length > 1) {
    const arrayPath = parts.slice(0, -1).join('.');
    extractKey = parts[parts.length - 1];
    const maybeArray = extractField(data, arrayPath);
    if (Array.isArray(maybeArray)) {
      sourceArray = maybeArray;
    }
  } else {
    // Find first array at root level
    for (const value of Object.values(data)) {
      if (Array.isArray(value)) {
        sourceArray = value;
        break;
      }
    }
  }

  if (!sourceArray) return [];

  // Extract the field from each item
  return sourceArray.map((item) => {
    if (item && typeof item === 'object' && extractKey in item) {
      return (item as Record<string, unknown>)[extractKey];
    }
    return null;
  }).filter((v) => v !== null);
}

/**
 * Runs a JavaScript transform on the data
 * Note: This uses Function constructor which should only run trusted code
 */
function runTransform(
  data: Record<string, unknown>,
  code?: string
): unknown {
  if (!code) return data;

  try {
    // Create a function that receives the data and returns the transformed result
    // The code should be a function body that uses 'data' variable
    const fn = new Function('data', `return (${code})`);
    return fn(data);
  } catch (error) {
    console.error('Transform error:', error);
    return data;
  }
}

/**
 * Validates transform code by attempting to parse it
 */
export function validateTransformCode(code: string): { valid: boolean; error?: string } {
  try {
    new Function('data', `return (${code})`);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid code',
    };
  }
}
