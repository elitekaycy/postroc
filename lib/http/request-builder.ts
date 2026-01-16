import type { Category, Custom, Header } from '@/lib/types/core';

/**
 * Check if a URL is absolute (starts with http:// or https://)
 */
export function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function buildRequestHeaders(
  custom: Custom,
  category?: Category | null
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Add category default headers if category exists
  if (category) {
    for (const header of category.config.defaultHeaders) {
      if (header.enabled) {
        headers[header.key] = header.value;
      }
    }

    const { auth } = category.config;
    if (auth.type === 'bearer' && auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    } else if (auth.type === 'api-key' && auth.apiKeyHeader && auth.apiKeyValue) {
      headers[auth.apiKeyHeader] = auth.apiKeyValue;
    } else if (auth.type === 'basic' && auth.username && auth.password) {
      const credentials = `${auth.username}:${auth.password}`;
      const encoded = typeof btoa !== 'undefined'
        ? btoa(credentials)
        : Buffer.from(credentials).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
    }
  }

  // Add custom headers
  if (custom.customHeaders) {
    for (const header of custom.customHeaders) {
      if (header.enabled) {
        headers[header.key] = header.value;
      }
    }
  }

  return headers;
}

export function getBaseUrl(category?: Category | null): string {
  if (!category) return '';
  const env = category.config.environments.find(
    (e) => e.name === category.config.activeEnvironment
  );
  return env?.baseUrl || '';
}

export function buildFullUrl(category: Category | null | undefined, endpoint: string): string {
  // If endpoint is already an absolute URL, use it directly
  if (isAbsoluteUrl(endpoint)) {
    return endpoint;
  }

  const baseUrl = getBaseUrl(category);
  if (!baseUrl) return endpoint;

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return `${normalizedBase}${normalizedEndpoint}`;
}

export function replacePathVariables(
  endpoint: string,
  data: Record<string, unknown>
): string {
  return endpoint.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    if (value !== undefined && value !== null) {
      return String(value);
    }
    return match;
  });
}

export function mergeHeaders(
  categoryHeaders: Header[],
  customHeaders: Header[] | undefined
): Header[] {
  const headerMap = new Map<string, Header>();

  for (const header of categoryHeaders) {
    headerMap.set(header.key.toLowerCase(), header);
  }

  if (customHeaders) {
    for (const header of customHeaders) {
      headerMap.set(header.key.toLowerCase(), header);
    }
  }

  return Array.from(headerMap.values());
}

export function getEffectiveHeaders(
  custom: Custom,
  category?: Category | null
): Header[] {
  const merged = mergeHeaders(
    category?.config.defaultHeaders || [],
    custom.customHeaders
  );

  if (!category) return merged;

  const { auth } = category.config;

  if (auth.type === 'bearer' && auth.token) {
    const existingAuthIndex = merged.findIndex(
      (h) => h.key.toLowerCase() === 'authorization'
    );
    const authHeader: Header = {
      id: 'auth-bearer',
      key: 'Authorization',
      value: `Bearer ${auth.token}`,
      enabled: true,
    };
    if (existingAuthIndex >= 0) {
      merged[existingAuthIndex] = authHeader;
    } else {
      merged.unshift(authHeader);
    }
  } else if (auth.type === 'api-key' && auth.apiKeyHeader && auth.apiKeyValue) {
    const existingIndex = merged.findIndex(
      (h) => h.key.toLowerCase() === auth.apiKeyHeader?.toLowerCase()
    );
    const apiKeyHeader: Header = {
      id: 'auth-api-key',
      key: auth.apiKeyHeader,
      value: auth.apiKeyValue,
      enabled: true,
    };
    if (existingIndex >= 0) {
      merged[existingIndex] = apiKeyHeader;
    } else {
      merged.unshift(apiKeyHeader);
    }
  } else if (auth.type === 'basic' && auth.username && auth.password) {
    const credentials = `${auth.username}:${auth.password}`;
    const encoded = typeof btoa !== 'undefined'
      ? btoa(credentials)
      : Buffer.from(credentials).toString('base64');
    const existingAuthIndex = merged.findIndex(
      (h) => h.key.toLowerCase() === 'authorization'
    );
    const basicHeader: Header = {
      id: 'auth-basic',
      key: 'Authorization',
      value: `Basic ${encoded}`,
      enabled: true,
    };
    if (existingAuthIndex >= 0) {
      merged[existingAuthIndex] = basicHeader;
    } else {
      merged.unshift(basicHeader);
    }
  }

  return merged;
}
