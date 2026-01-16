import type { Custom, Category, Field } from '@/lib/types/core';
import { buildDependencyGraph, topologicalSort } from './dependency-resolver';
import { generateFieldValue } from './data-generator';
import { fetchFieldData } from '@/lib/http/api-fetcher';

export interface ResolvedData {
  customId: string;
  customName: string;
  data: Record<string, unknown>;
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

    const result = await resolveCustomData(custom, category, resolvedData);
    resolvedData.set(customId, result);
  }

  return resolvedData;
}

async function resolveCustomData(
  custom: Custom,
  category: Category | null | undefined,
  resolved: Map<string, ResolvedData>
): Promise<ResolvedData> {
  const data: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const field of custom.fields) {
    if (!field.isExported) continue;

    try {
      const value = await resolveFieldValue(field, category, resolved);
      data[field.key] = value;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`${field.key}: ${errorMessage}`);
      data[field.key] = null;
    }
  }

  return {
    customId: custom.id,
    customName: custom.name,
    data,
    errors,
  };
}

async function resolveFieldValue(
  field: Field,
  category: Category | null | undefined,
  resolved: Map<string, ResolvedData>
): Promise<unknown> {
  switch (field.type) {
    case 'reference':
      return resolveReference(field, resolved);

    case 'api-fetch':
      return resolveApiFetch(field, category);

    default:
      return generateFieldValue(field);
  }
}

function resolveReference(
  field: Field,
  resolved: Map<string, ResolvedData>
): unknown {
  if (!field.referenceId) {
    return null;
  }

  const referencedData = resolved.get(field.referenceId);
  if (!referencedData) {
    throw new Error(`Reference not found: ${field.referenceId}`);
  }

  return referencedData.data;
}

async function resolveApiFetch(
  field: Field,
  category: Category | null | undefined
): Promise<unknown> {
  if (!field.apiEndpoint) {
    return generateFieldValue({ ...field, type: 'string' });
  }

  // api-fetch requires a category for auth/headers
  if (!category) {
    return generateFieldValue({ ...field, type: 'string' });
  }

  try {
    return await fetchFieldData(field, category);
  } catch (error) {
    return generateFieldValue({ ...field, type: 'string' });
  }
}

export async function resolveSingleCustom(
  custom: Custom,
  category?: Category | null
): Promise<ResolvedData> {
  const resolved = new Map<string, ResolvedData>();
  return resolveCustomData(custom, category, resolved);
}

export function generatePreviewData(custom: Custom): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const field of custom.fields) {
    if (!field.isExported) continue;

    if (field.type === 'reference') {
      data[field.key] = { _ref: field.referenceId };
    } else if (field.type === 'api-fetch') {
      data[field.key] = { _fetch: field.apiEndpoint };
    } else {
      data[field.key] = generateFieldValue(field);
    }
  }

  return data;
}
