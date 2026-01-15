export type Environment = 'local' | 'staging' | 'production';

export interface EnvironmentConfig {
  name: Environment;
  baseUrl: string;
}

export type AuthType = 'none' | 'bearer' | 'api-key' | 'basic';

export interface AuthConfig {
  type: AuthType;
  token?: string;
  apiKeyHeader?: string;
  apiKeyValue?: string;
  username?: string;
  password?: string;
}

export interface Header {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  method: HttpMethod;
  endpoint: string;
  body?: string;
}

export interface CategoryConfig {
  id: string;
  name: string;
  projectId: string;
  environments: EnvironmentConfig[];
  activeEnvironment: Environment;
  auth: AuthConfig;
  defaultHeaders: Header[];
  createdAt: number;
  updatedAt: number;
}

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'reference'
  | 'api-fetch';

export interface Field {
  id: string;
  key: string;
  type: FieldType;
  value?: unknown;
  referenceId?: string;
  apiEndpoint?: string;
  isExported: boolean;
  description?: string;
}

export interface Custom {
  id: string;
  name: string;
  categoryId: string;
  fields: Field[];
  requestConfig?: RequestConfig;
  customHeaders?: Header[];
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  projectId: string;
  description?: string;
  config: CategoryConfig;
  customs: Custom[];
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  workspaceId: string;
  categories: Category[];
  createdAt: number;
}

export interface Workspace {
  id: string;
  name: string;
  projects: Project[];
  createdAt: number;
}

export enum ExportFormat {
  JSON = 'json',
  XML = 'xml',
  FORM_DATA = 'form-data',
  URL_ENCODED = 'url-encoded',
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  duration: number;
  error?: string;
}
