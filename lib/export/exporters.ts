export type ExportFormat = 'json' | 'xml' | 'form-data' | 'url-encoded';

export interface ExportOptions {
  format: ExportFormat;
  prettyPrint?: boolean;
  rootElement?: string;
}

export function exportData(
  data: Record<string, unknown>,
  options: ExportOptions
): string {
  const { format, prettyPrint = true, rootElement = 'root' } = options;

  switch (format) {
    case 'json':
      return toJson(data, prettyPrint);
    case 'xml':
      return toXml(data, rootElement);
    case 'form-data':
      return toFormData(data);
    case 'url-encoded':
      return toUrlEncoded(data);
    default:
      return toJson(data, prettyPrint);
  }
}

export function toJson(data: Record<string, unknown>, prettyPrint = true): string {
  return prettyPrint
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);
}

export function toXml(data: Record<string, unknown>, rootName = 'root'): string {
  const escapeXml = (str: string): string =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const indent = (level: number): string => '  '.repeat(level);

  const convert = (value: unknown, key: string, level: number): string => {
    const pad = indent(level);

    if (value === null || value === undefined) {
      return `${pad}<${key}/>`;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${pad}<${key}/>`;
      }
      const items = value
        .map((item) => convert(item, 'item', level + 1))
        .join('\n');
      return `${pad}<${key}>\n${items}\n${pad}</${key}>`;
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) {
        return `${pad}<${key}/>`;
      }
      const inner = entries
        .map(([k, v]) => convert(v, k, level + 1))
        .join('\n');
      return `${pad}<${key}>\n${inner}\n${pad}</${key}>`;
    }

    return `${pad}<${key}>${escapeXml(String(value))}</${key}>`;
  };

  const entries = Object.entries(data);
  if (entries.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}/>`;
  }

  const inner = entries
    .map(([k, v]) => convert(v, k, 1))
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${inner}\n</${rootName}>`;
}

export function toFormData(data: Record<string, unknown>): string {
  const lines: string[] = [];

  const flatten = (obj: unknown, prefix = ''): void => {
    if (obj === null || obj === undefined) {
      lines.push(`${prefix}: (empty)`);
      return;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        lines.push(`${prefix}: (empty array)`);
        return;
      }
      obj.forEach((item, i) => flatten(item, `${prefix}[${i}]`));
      return;
    }

    if (typeof obj === 'object') {
      const entries = Object.entries(obj as Record<string, unknown>);
      if (entries.length === 0) {
        lines.push(`${prefix}: (empty object)`);
        return;
      }
      entries.forEach(([k, v]) => {
        flatten(v, prefix ? `${prefix}[${k}]` : k);
      });
      return;
    }

    lines.push(`${prefix}: ${String(obj)}`);
  };

  flatten(data);
  return lines.join('\n');
}

export function toUrlEncoded(data: Record<string, unknown>): string {
  const pairs: string[] = [];

  const flatten = (obj: unknown, prefix = ''): void => {
    if (obj === null || obj === undefined) {
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, i) => flatten(item, `${prefix}[${i}]`));
      return;
    }

    if (typeof obj === 'object') {
      Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
        flatten(v, prefix ? `${prefix}[${k}]` : k);
      });
      return;
    }

    pairs.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(obj))}`);
  };

  flatten(data);
  return pairs.join('&');
}

export function getContentType(format: ExportFormat): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'xml':
      return 'application/xml';
    case 'form-data':
      return 'multipart/form-data';
    case 'url-encoded':
      return 'application/x-www-form-urlencoded';
    default:
      return 'application/json';
  }
}

export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'json':
      return 'json';
    case 'xml':
      return 'xml';
    case 'form-data':
      return 'txt';
    case 'url-encoded':
      return 'txt';
    default:
      return 'json';
  }
}

export function downloadExport(
  data: Record<string, unknown>,
  filename: string,
  options: ExportOptions
): void {
  const content = exportData(data, options);
  const contentType = getContentType(options.format);
  const extension = getFileExtension(options.format);

  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyToClipboard(
  data: Record<string, unknown>,
  options: ExportOptions
): Promise<void> {
  const content = exportData(data, options);
  return navigator.clipboard.writeText(content);
}
