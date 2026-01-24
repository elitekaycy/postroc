import type { Custom, Category, Field } from '@/lib/types/core';
import { buildDependencyGraph, topologicalSort } from './dependency-resolver';
import { generateFieldValue } from './data-generator';
import { fetchFieldData } from '@/lib/http/api-fetcher';
import { applyExportConfig } from './export-transform';

export interface ResolvedData {
  customId: string;
  customName: string;
  data: Record<string, unknown>;
  exportedData: unknown; // Data after applying export config
  errors: string[];
}

export async function resolveData(
  customs: Custom[],
  category?: Category | null
): Promise<Map<string, ResolvedData>> {
  const graph = buildDependencyGraph(customs);
  const orderedIds = topologicalSort(graph);
  const resolvedData = new Map<string, ResolvedData>();
  const customMap = new Map(customs.map((c) => [c.id, c]));

  for (const customId of orderedIds) {
    const custom = customMap.get(customId);
    if (!custom) continue;

    const result = await resolveCustomData(custom, category, resolvedData, customMap);
    resolvedData.set(customId, result);
  }

  return resolvedData;
}

async function resolveCustomData(
  custom: Custom,
  category: Category | null | undefined,
  resolved: Map<string, ResolvedData>,
  customMap: Map<string, Custom>
): Promise<ResolvedData> {
  const data: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const field of custom.fields) {
    if (!field.isExported) continue;

    try {
      const value = await resolveFieldValue(field, category, resolved, customMap);
      data[field.key] = value;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`${field.key}: ${errorMessage}`);
      data[field.key] = null;
    }
  }

  // Apply export config to get the exported form of this data
  const exportedData = applyExportConfig(data, custom.exportConfig);

  return {
    customId: custom.id,
    customName: custom.name,
    data,
    exportedData,
    errors,
  };
}

async function resolveFieldValue(
  field: Field,
  category: Category | null | undefined,
  resolved: Map<string, ResolvedData>,
  customMap: Map<string, Custom>
): Promise<unknown> {
  switch (field.type) {
    case 'reference':
      return resolveReference(field, resolved, customMap);

    case 'api-fetch':
      return resolveApiFetch(field, category);

    default:
      return generateFieldValue(field);
  }
}

function resolveReference(
  field: Field,
  resolved: Map<string, ResolvedData>,
  customMap: Map<string, Custom>
): unknown {
  if (!field.referenceId) {
    return null;
  }

  const referencedData = resolved.get(field.referenceId);
  if (!referencedData) {
    throw new Error(`Reference not found: ${field.referenceId}`);
  }

  const referencedCustom = customMap.get(field.referenceId);

  // If referenceKey is specified, extract that specific key from the referenced data
  if (field.referenceKey && field.referenceKey.trim()) {
    const keys = field.referenceKey.split('.');
    let value: unknown = referencedData.data;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return null;
      }
    }

    return value;
  }

  // If the referenced custom has an export config, use the exported data
  if (referencedCustom?.exportConfig && referencedCustom.exportConfig.type !== 'full') {
    return referencedData.exportedData;
  }

  return referencedData.data;
}

/**
 * Resolve an api-fetch field.
 * If the field has children (populated from a previous fetch), generate from those.
 * If it has a stored value, use that directly.
 * Only fetch live if no stored data exists.
 */
async function resolveApiFetch(
  field: Field,
  category: Category | null | undefined
): Promise<unknown> {
  // If the field has children (populated from fetch), generate data from them
  if (field.children && field.children.length > 0) {
    if (field.arrayItemType === 'mixed') {
      // Mixed array: each child is one item in the array
      return field.children
        .filter((child) => child.isExported)
        .map((child) => generateFieldValue(child));
    }

    if (field.arrayItemType === 'object') {
      // Array of objects: generate N items using children as template
      const count = field.arrayCount ?? field.children.length;
      const items: Record<string, unknown>[] = [];
      for (let i = 0; i < count; i++) {
        const obj: Record<string, unknown> = {};
        for (const child of field.children) {
          if (child.isExported) {
            obj[child.key] = generateFieldValue(child);
          }
        }
        items.push(obj);
      }
      return items;
    }

    // Object type with children
    const obj: Record<string, unknown> = {};
    for (const child of field.children) {
      if (child.isExported) {
        obj[child.key] = generateFieldValue(child);
      }
    }
    return obj;
  }

  // If value is stored directly, use it
  if (field.value !== undefined && field.value !== null && field.value !== '') {
    return field.value;
  }

  // No stored data - attempt live fetch if endpoint is configured
  if (!field.apiEndpoint) {
    return generateFieldValue({ ...field, type: 'string' });
  }

  try {
    return await fetchFieldData(field, category ?? undefined);
  } catch {
    return null;
  }
}

export async function resolveSingleCustom(
  custom: Custom,
  category?: Category | null,
  allCustoms?: Custom[]
): Promise<ResolvedData> {
  // If we have all customs, resolve dependencies first
  if (allCustoms && allCustoms.length > 0) {
    const customsToResolve = allCustoms.filter(c => c.id !== custom.id);
    customsToResolve.push(custom); // Add current custom at the end

    const resolvedMap = await resolveData(customsToResolve, category);
    const result = resolvedMap.get(custom.id);

    if (result) {
      return result;
    }
  }

  // Fallback: resolve without dependencies
  const resolved = new Map<string, ResolvedData>();
  const customMap = new Map([[custom.id, custom]]);
  return resolveCustomData(custom, category, resolved, customMap);
}

export function generatePreviewData(custom: Custom): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const field of custom.fields) {
    if (!field.isExported) continue;

    if (field.type === 'reference') {
      const refLabel = field.referenceKey
        ? `${field.referenceId}.${field.referenceKey}`
        : field.referenceId;
      data[field.key] = { _ref: refLabel };
    } else if (field.type === 'api-fetch') {
      data[field.key] = { _fetch: field.apiEndpoint };
    } else {
      data[field.key] = generateFieldValue(field);
    }
  }

  return data;
}
