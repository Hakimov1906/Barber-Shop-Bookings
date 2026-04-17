import type { ReactNode } from "react";

export type SortDirection = "asc" | "desc";

export type EntityRecord = Record<string, unknown>;
export type FormValues = Record<string, unknown>;

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "phone"
  | "password"
  | "date"
  | "time"
  | "tags";

export type ColumnDataType = "text" | "number" | "date" | "datetime" | "time" | "boolean" | "array";

export type FieldOption = {
  label: string;
  value: string | number;
};

export type FormFieldConfig = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: FieldOption[];
  entityKey?: string;
  minLength?: number;
  maxLength?: number;
  hiddenOnCreate?: boolean;
  hiddenOnEdit?: boolean;
  disabledOnEdit?: boolean;
};

export type ColumnConfig = {
  key: string;
  label: string;
  dataType?: ColumnDataType;
  sortable?: boolean;
  width?: string;
  render?: (row: EntityRecord) => ReactNode;
};

export type ListParams = {
  limit: number;
  offset: number;
  query?: Record<string, string | number | boolean | undefined>;
};

export type ListPayload<T extends EntityRecord> = {
  items: T[];
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
  serverPaginated: boolean;
};

export type ResourceAdapter<T extends EntityRecord = EntityRecord> = {
  key: string;
  label: string;
  idKeys: string[];
  supportsServerPagination: boolean;
  list: (token: string, params: ListParams, signal?: AbortSignal) => Promise<ListPayload<T>>;
  get: (token: string, ids: Record<string, string | number>) => Promise<T>;
  create: (token: string, payload: Record<string, unknown>) => Promise<T | EntityRecord>;
  update: (token: string, ids: Record<string, string | number>, payload: Record<string, unknown>) => Promise<T | EntityRecord>;
  remove: (token: string, ids: Record<string, string | number>) => Promise<EntityRecord>;
};

export type DrawerMode = "create" | "edit" | "view";

export type ResourceConfig<T extends EntityRecord = EntityRecord> = {
  key: string;
  route: string;
  title: string;
  description: string;
  adapter: ResourceAdapter<T>;
  columns: ColumnConfig[];
  fields: FormFieldConfig[];
  defaultSort: { key: string; direction: SortDirection };
  searchKeys: string[];
  staticQuery?: Record<string, string | number | boolean>;
  createPayload?: (values: FormValues) => Record<string, unknown>;
  updatePayload?: (values: FormValues) => Record<string, unknown>;
  normalizeForForm?: (entity: EntityRecord) => FormValues;
  afterSaveMessage?: string;
};

