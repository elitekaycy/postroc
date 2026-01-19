import type { Category, Field } from '@/lib/types/core';
import { buildRequestHeaders, getBaseUrl } from './request-builder';

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

export function clearCache(): void {
  cache.clear();
}

export function clearCacheEntry(key: string): void {
  cache.delete(key);
}

export async function fetchFieldData(
  field: Field,
  category?: Category
): Promise<unknown> {
  if (field.type !== 'api-fetch' || !field.apiEndpoint) {
    throw new Error('Field is not configured for API fetch');
  }

  const baseUrl = category ? getBaseUrl(category) : '';
  const url = buildUrl(baseUrl, field.apiEndpoint);
  const cacheKey = category
    ? `${category.id}-${category.config.baseUrl}-${field.apiEndpoint}`
    : `no-category-${field.apiEndpoint}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const headers = category
    ? buildRequestHeaders(
        { id: '', name: '', projectId: category.projectId, categoryId: category.id, fields: [], createdAt: 0, updatedAt: 0 },
        category
      )
    : {};

  let lastError: Error | null = null;
  const maxRetries = 2;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        await delay(1000 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Failed to fetch data');
}

function buildUrl(baseUrl: string, endpoint: string): string {
  if (!baseUrl) {
    return endpoint;
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return `${normalizedBase}${normalizedEndpoint}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function testEndpoint(
  endpoint: string,
  category: Category
): Promise<{ success: boolean; data?: unknown; error?: string; duration: number }> {
  const startTime = Date.now();

  try {
    const baseUrl = getBaseUrl(category);
    const url = buildUrl(baseUrl, endpoint);

    const headers = buildRequestHeaders(
      { id: '', name: '', projectId: category.projectId, categoryId: category.id, fields: [], createdAt: 0, updatedAt: 0 },
      category
    );

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        duration,
      };
    }

    const data = await response.json();
    return { success: true, data, duration };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}
