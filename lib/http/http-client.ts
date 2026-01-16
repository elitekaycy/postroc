import type { Custom, Category, HttpResponse } from '@/lib/types/core';
import { buildRequestHeaders, getBaseUrl, replacePathVariables } from './request-builder';
import { resolveSingleCustom } from '@/lib/engine/data-resolver';

export async function sendRequest(
  custom: Custom,
  category: Category
): Promise<HttpResponse> {
  const startTime = Date.now();

  try {
    const resolved = await resolveSingleCustom(custom, category);
    const data = resolved.data;

    const baseUrl = getBaseUrl(category);
    let endpoint = custom.requestConfig?.endpoint || '/';

    endpoint = replacePathVariables(endpoint, data);

    const url = buildFullUrl(baseUrl, endpoint);
    const headers = buildRequestHeaders(custom, category);

    const method = custom.requestConfig?.method || 'GET';

    const options: RequestInit = {
      method,
      headers,
    };

    if (method !== 'GET' && Object.keys(data).length > 0) {
      options.body = JSON.stringify(data);
      if (!headers['Content-Type']) {
        (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    const contentType = response.headers.get('content-type');
    let body: unknown;

    if (contentType?.includes('application/json')) {
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
    } else {
      body = await response.text();
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      status: 0,
      statusText: 'Error',
      headers: {},
      body: null,
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildFullUrl(baseUrl: string, endpoint: string): string {
  if (!baseUrl) {
    return endpoint;
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return `${normalizedBase}${normalizedEndpoint}`;
}

export async function sendRawRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: unknown
): Promise<HttpResponse> {
  const startTime = Date.now();

  try {
    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    const contentType = response.headers.get('content-type');
    let responseBody: unknown;

    if (contentType?.includes('application/json')) {
      try {
        responseBody = await response.json();
      } catch {
        responseBody = await response.text();
      }
    } else {
      responseBody = await response.text();
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      duration,
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'Error',
      headers: {},
      body: null,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function getStatusColor(status: number): 'green' | 'yellow' | 'red' | 'gray' {
  if (status === 0) return 'gray';
  if (status >= 200 && status < 300) return 'green';
  if (status >= 300 && status < 400) return 'yellow';
  if (status >= 400 && status < 500) return 'yellow';
  return 'red';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
