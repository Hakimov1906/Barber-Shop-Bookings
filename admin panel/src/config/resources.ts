import { createCrudAdapter } from "../api";
import type { FormValues, ResourceConfig } from "../types";

const STATUS_OPTIONS = [
  { label: "available", value: "available" },
  { label: "booked", value: "booked" },
  { label: "blocked", value: "blocked" },
];

function parseTags(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumberOrUndefined(value: unknown) {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function toOptionalString(value: unknown) {
  const str = String(value ?? "").trim();
  return str.length ? str : undefined;
}

function toOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

const adminsConfig: ResourceConfig = {
  key: "admins",
  route: "/admins",
  title: "Администраторы",
  description: "Таблица admins из production БД.",
  adapter: createCrudAdapter({
    key: "admins",
    label: "Admins",
    basePath: "/api/admin/admins",
    idKeys: ["id"],
    supportsServerPagination: true,
  }),
  columns: [
    { key: "id", label: "ID", dataType: "number", sortable: true, width: "80px" },
    { key: "full_name", label: "ФИО", sortable: true },
    { key: "phone", label: "Телефон", sortable: true },
    { key: "created_at", label: "Создан", dataType: "datetime", sortable: true },
    { key: "updated_at", label: "Обновлен", dataType: "datetime", sortable: true },
  ],
  fields: [
    { key: "fullName", entityKey: "full_name", label: "ФИО", kind: "text", required: true, minLength: 2, maxLength: 120 },
    { key: "phone", label: "Телефон", kind: "phone", required: true },
    { key: "password", label: "Пароль", kind: "password", required: true, minLength: 6, maxLength: 20, pattern: "[A-Za-z0-9]+" },
  ],
  defaultSort: { key: "id", direction: "desc" },
  searchKeys: ["id", "full_name", "phone"],
  createPayload(values) {
    return {
      fullName: String(values.fullName || "").trim(),
      phone: String(values.phone || "").trim(),
      password: String(values.password || "").trim(),
    };
  },
  updatePayload(values) {
    const payload: Record<string, unknown> = {
      fullName: toOptionalString(values.fullName),
      phone: toOptionalString(values.phone),
    };
    const password = toOptionalString(values.password);
    if (password) payload.password = password;
    return payload;
  },
};

const usersConfig: ResourceConfig = {
  key: "users",
  route: "/users",
  title: "Пользователи",
  description: "Управление user-аккаунтами (phone-only).",
  adapter: createCrudAdapter({
    key: "users",
    label: "Users",
    basePath: "/api/admin/users",
    idKeys: ["id"],
    supportsServerPagination: true,
  }),
  columns: [
    { key: "id", label: "ID", dataType: "number", sortable: true, width: "80px" },
    { key: "full_name", label: "ФИО", sortable: true },
    { key: "phone", label: "Телефон", sortable: true },
    { key: "created_at", label: "Создан", dataType: "datetime", sortable: true },
  ],
  fields: [
    { key: "fullName", entityKey: "full_name", label: "ФИО", kind: "text", required: true, minLength: 2, maxLength: 120 },
    { key: "phone", label: "Телефон", kind: "phone", required: true },
    { key: "password", label: "Пароль", kind: "password", required: true, minLength: 6, maxLength: 20, pattern: "[A-Za-z0-9]+" },
  ],
  defaultSort: { key: "id", direction: "desc" },
  searchKeys: ["id", "full_name", "phone"],
  createPayload(values) {
    return {
      fullName: String(values.fullName || "").trim(),
      phone: String(values.phone || "").trim(),
      password: String(values.password || "").trim(),
    };
  },
  updatePayload(values) {
    const payload: Record<string, unknown> = {
      fullName: toOptionalString(values.fullName),
      phone: toOptionalString(values.phone),
    };
    const password = toOptionalString(values.password);
    if (password) payload.password = password;
    return payload;
  },
};

const salonsConfig: ResourceConfig = {
  key: "salons",
  route: "/salons",
  title: "Салоны",
  description: "Справочник салонов HairLine.",
  adapter: createCrudAdapter({
    key: "salons",
    label: "Salons",
    basePath: "/api/admin/salons",
    idKeys: ["id"],
    supportsServerPagination: false,
    staticQuery: { includeInactive: true },
  }),
  columns: [
    { key: "id", label: "ID", dataType: "number", sortable: true, width: "80px" },
    { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Название", sortable: true },
    { key: "address", label: "Адрес" },
    { key: "work_hours", label: "График", sortable: true },
    { key: "is_active", label: "Активен", dataType: "boolean", sortable: true, width: "100px" },
    { key: "updated_at", label: "Обновлен", dataType: "datetime", sortable: true },
  ],
  fields: [
    { key: "code", label: "Code", kind: "text", required: true },
    { key: "name", label: "Название", kind: "text", required: true },
    { key: "address", label: "Адрес", kind: "text", required: true },
    { key: "workHours", entityKey: "work_hours", label: "Часы работы", kind: "text", required: true },
    { key: "latitude", label: "Latitude", kind: "number", required: true, step: 0.000001 },
    { key: "longitude", label: "Longitude", kind: "number", required: true, step: 0.000001 },
    { key: "sortOrder", entityKey: "sort_order", label: "Sort order", kind: "number", min: 0 },
    { key: "isActive", entityKey: "is_active", label: "Активен", kind: "boolean" },
  ],
  defaultSort: { key: "id", direction: "desc" },
  searchKeys: ["id", "code", "name", "address"],
  createPayload(values) {
    return {
      code: String(values.code || "").trim().toLowerCase(),
      name: String(values.name || "").trim(),
      address: String(values.address || "").trim(),
      workHours: String(values.workHours || "").trim(),
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      sortOrder: toNumberOrUndefined(values.sortOrder),
      isActive: toOptionalBoolean(values.isActive),
    };
  },
  updatePayload(values) {
    return {
      code: toOptionalString(values.code)?.toLowerCase(),
      name: toOptionalString(values.name),
      address: toOptionalString(values.address),
      workHours: toOptionalString(values.workHours),
      latitude: toNumberOrUndefined(values.latitude),
      longitude: toNumberOrUndefined(values.longitude),
      sortOrder: toNumberOrUndefined(values.sortOrder),
      isActive: toOptionalBoolean(values.isActive),
    };
  },
};

const barbersConfig: ResourceConfig = {
  key: "barbers",
  route: "/barbers",
  title: "Барберы",
  description: "Onboarding барберов с привязкой к салону.",
  adapter: createCrudAdapter({
    key: "barbers",
    label: "Barbers",
    basePath: "/api/admin/barbers",
    idKeys: ["id"],
    supportsServerPagination: false,
    staticQuery: { includeInactive: true },
  }),
  columns: [
    { key: "id", label: "ID", dataType: "number", sortable: true, width: "80px" },
    { key: "name", label: "Имя", sortable: true },
    { key: "role", label: "Роль", sortable: true },
    { key: "salon_id", label: "Salon ID", dataType: "number", sortable: true, width: "110px" },
    { key: "specialties", label: "Специализации", dataType: "array" },
    { key: "is_available", label: "Доступен", dataType: "boolean", sortable: true, width: "110px" },
    { key: "is_active", label: "Активен", dataType: "boolean", sortable: true, width: "100px" },
    { key: "created_at", label: "Создан", dataType: "datetime", sortable: true },
  ],
  fields: [
    { key: "name", label: "Имя", kind: "text", required: true },
    { key: "role", label: "Роль", kind: "text" },
    { key: "experienceYears", entityKey: "experience_years", label: "Стаж (лет)", kind: "number", min: 1, max: 80 },
    { key: "salonId", entityKey: "salon_id", label: "Салон", kind: "select" },
    { key: "specialties", label: "Специализации", kind: "tags", helpText: "Через запятую или Enter" },
    { key: "imageUrl", entityKey: "image_url", label: "Image URL", kind: "text" },
    { key: "location", label: "Локация", kind: "text" },
    { key: "bio", label: "Bio", kind: "textarea", maxLength: 5000 },
    { key: "isAvailable", entityKey: "is_available", label: "Доступен", kind: "boolean" },
    { key: "isActive", entityKey: "is_active", label: "Активен", kind: "boolean" },
  ],
  defaultSort: { key: "id", direction: "desc" },
  searchKeys: ["id", "name", "role", "location", "salon_id"],
  normalizeForForm(entity) {
    return {
      ...entity,
      salonId: entity.salon_id ?? "",
      experienceYears: entity.experience_years ?? "",
      imageUrl: entity.image_url ?? "",
      isAvailable: entity.is_available ?? true,
      isActive: entity.is_active ?? true,
      specialties: Array.isArray(entity.specialties) ? entity.specialties : [],
    };
  },
  createPayload(values) {
    return {
      name: String(values.name || "").trim(),
      role: toOptionalString(values.role),
      experienceYears: toNumberOrUndefined(values.experienceYears),
      salonId: toNumberOrUndefined(values.salonId),
      specialties: parseTags(values.specialties),
      imageUrl: toOptionalString(values.imageUrl) || "",
      location: toOptionalString(values.location),
      bio: toOptionalString(values.bio),
      isAvailable: toOptionalBoolean(values.isAvailable),
      isActive: toOptionalBoolean(values.isActive),
    };
  },
  updatePayload(values) {
    return {
      name: toOptionalString(values.name),
      role: toOptionalString(values.role),
      experienceYears: toNumberOrUndefined(values.experienceYears),
      salonId: values.salonId === "" ? null : toNumberOrUndefined(values.salonId),
      specialties: parseTags(values.specialties),
      imageUrl: toOptionalString(values.imageUrl) || "",
      location: toOptionalString(values.location),
      bio: toOptionalString(values.bio),
      isAvailable: toOptionalBoolean(values.isAvailable),
      isActive: toOptionalBoolean(values.isActive),
    };
  },
};

const servicesConfig: ResourceConfig = {
  key: "services",
  route: "/services",
  title: "Услуги",
  description: "Тарифы и длительность услуг.",
  adapter: createCrudAdapter({
    key: "services",
    label: "Services",
    basePath: "/api/admin/services",
    idKeys: ["id"],
    supportsServerPagination: false,
  }),
  columns: [
    { key: "id", label: "ID", dataType: "number", sortable: true, width: "80px" },
    { key: "name", label: "Название", sortable: true },
    { key: "duration_minutes", label: "Минут", dataType: "number", sortable: true, width: "100px" },
    { key: "price", label: "Цена", dataType: "number", sortable: true, width: "120px" },
    { key: "is_active", label: "Активна", dataType: "boolean", sortable: true, width: "100px" },
    { key: "created_at", label: "Создана", dataType: "datetime", sortable: true },
  ],
  fields: [
    { key: "name", label: "Название", kind: "text", required: true },
    { key: "durationMinutes", entityKey: "duration_minutes", label: "Длительность (мин)", kind: "number", required: true, min: 1, max: 480 },
    { key: "price", label: "Цена", kind: "number", required: true, min: 0, step: 1 },
    { key: "isActive", entityKey: "is_active", label: "Активна", kind: "boolean" },
  ],
  defaultSort: { key: "id", direction: "desc" },
  searchKeys: ["id", "name"],
  createPayload(values) {
    return {
      name: String(values.name || "").trim(),
      durationMinutes: Number(values.durationMinutes),
      price: Number(values.price),
      isActive: toOptionalBoolean(values.isActive),
    };
  },
  updatePayload(values) {
    return {
      name: toOptionalString(values.name),
      durationMinutes: toNumberOrUndefined(values.durationMinutes),
      price: toNumberOrUndefined(values.price),
      isActive: toOptionalBoolean(values.isActive),
    };
  },
};

const productsConfig: ResourceConfig = {
  key: "products",
  route: "/products",
  title: "Товары",
  description: "Каталог магазина и остатки.",
  adapter: createCrudAdapter({
    key: "products",
    label: "Products",
    basePath: "/api/admin/products",
    idKeys: ["id"],
    supportsServerPagination: false,
  }),
  columns: [
    { key: "id", label: "ID", dataType: "number", sortable: true, width: "80px" },
    { key: "name", label: "Название", sortable: true },
    { key: "category", label: "Категория", sortable: true, width: "100px" },
    { key: "type", label: "Тип", sortable: true, width: "120px" },
    { key: "price", label: "Цена", dataType: "number", sortable: true, width: "100px" },
    { key: "stock_qty", label: "Остаток", dataType: "number", sortable: true, width: "100px" },
    { key: "is_active", label: "Активен", dataType: "boolean", sortable: true, width: "100px" },
  ],
  fields: [
    { key: "name", label: "Название", kind: "text", required: true },
    { key: "description", label: "Описание", kind: "textarea", required: true },
    { key: "price", label: "Цена", kind: "number", required: true, min: 0 },
    { key: "imageUrl", entityKey: "image_url", label: "Image URL", kind: "text" },
    {
      key: "category",
      label: "Категория",
      kind: "select",
      required: true,
      options: [
        { label: "men", value: "men" },
        { label: "women", value: "women" },
        { label: "unisex", value: "unisex" },
      ],
    },
    { key: "type", label: "Тип", kind: "text", required: true },
    { key: "stockQty", entityKey: "stock_qty", label: "Остаток", kind: "number", required: true, min: 0 },
    { key: "isActive", entityKey: "is_active", label: "Активен", kind: "boolean" },
  ],
  defaultSort: { key: "id", direction: "desc" },
  searchKeys: ["id", "name", "category", "type"],
  createPayload(values) {
    return {
      name: String(values.name || "").trim(),
      description: String(values.description || "").trim(),
      price: Number(values.price),
      imageUrl: toOptionalString(values.imageUrl) || "",
      category: String(values.category || "").trim(),
      type: String(values.type || "").trim(),
      stockQty: Number(values.stockQty),
      isActive: toOptionalBoolean(values.isActive),
    };
  },
  updatePayload(values) {
    return {
      name: toOptionalString(values.name),
      description: toOptionalString(values.description),
      price: toNumberOrUndefined(values.price),
      imageUrl: toOptionalString(values.imageUrl) || "",
      category: toOptionalString(values.category),
      type: toOptionalString(values.type),
      stockQty: toNumberOrUndefined(values.stockQty),
      isActive: toOptionalBoolean(values.isActive),
    };
  },
};

const slotsConfig: ResourceConfig = {
  key: "slots",
  route: "/slots",
  title: "Слоты",
  description: "Управление расписанием и массовая генерация.",
  adapter: createCrudAdapter({
    key: "slots",
    label: "Slots",
    basePath: "/api/admin/slots",
    idKeys: ["id"],
    supportsServerPagination: true,
  }),
  columns: [
    { key: "id", label: "ID", dataType: "number", sortable: true, width: "80px" },
    { key: "barber_id", label: "Barber ID", dataType: "number", sortable: true, width: "100px" },
    { key: "date", label: "Дата", dataType: "date", sortable: true, width: "120px" },
    { key: "time", label: "Время", dataType: "time", sortable: true, width: "90px" },
    { key: "status", label: "Статус", sortable: true, width: "110px" },
    { key: "created_at", label: "Создан", dataType: "datetime", sortable: true },
  ],
  fields: [
    { key: "barberId", entityKey: "barber_id", label: "Барбер", kind: "select", required: true },
    { key: "date", label: "Дата", kind: "date", required: true },
    { key: "time", label: "Время", kind: "time", required: true },
    { key: "status", label: "Статус", kind: "select", options: STATUS_OPTIONS },
  ],
  defaultSort: { key: "id", direction: "desc" },
  searchKeys: ["id", "barber_id", "date", "time", "status"],
  createPayload(values) {
    return {
      barberId: Number(values.barberId),
      date: String(values.date || ""),
      times: [String(values.time || "")],
      status: toOptionalString(values.status),
    };
  },
  updatePayload(values) {
    return {
      barberId: toNumberOrUndefined(values.barberId),
      date: toOptionalString(values.date),
      time: toOptionalString(values.time),
      status: toOptionalString(values.status),
    };
  },
};

const bookingsConfig: ResourceConfig = {
  key: "bookings",
  route: "/bookings",
  title: "Записи",
  description: "CRUD бронирований и связей со слотами.",
  adapter: createCrudAdapter({
    key: "bookings",
    label: "Bookings",
    basePath: "/api/admin/bookings",
    idKeys: ["id"],
    supportsServerPagination: true,
  }),
  columns: [
    { key: "id", label: "ID", dataType: "number", sortable: true, width: "80px" },
    { key: "user_id", label: "User", dataType: "number", sortable: true, width: "90px" },
    { key: "service_name", label: "Услуга", sortable: true },
    { key: "barber_name", label: "Барбер", sortable: true },
    { key: "date", label: "Дата", dataType: "date", sortable: true, width: "120px" },
    { key: "time", label: "Время", dataType: "time", sortable: true, width: "90px" },
    { key: "created_at", label: "Создана", dataType: "datetime", sortable: true },
  ],
  fields: [
    { key: "userId", entityKey: "user_id", label: "User ID", kind: "number", required: true, min: 1 },
    { key: "serviceId", entityKey: "service_id", label: "Service ID", kind: "number", required: true, min: 1 },
    { key: "barberId", entityKey: "barber_id", label: "Barber ID", kind: "number", required: true, min: 1 },
    { key: "date", label: "Дата", kind: "date", required: true },
    { key: "time", label: "Время", kind: "time", required: true },
  ],
  defaultSort: { key: "id", direction: "desc" },
  searchKeys: ["id", "user_id", "service_name", "barber_name", "date", "time"],
  createPayload(values) {
    return {
      userId: Number(values.userId),
      serviceId: Number(values.serviceId),
      barberId: Number(values.barberId),
      date: String(values.date || ""),
      time: String(values.time || ""),
    };
  },
  updatePayload(values) {
    return {
      userId: toNumberOrUndefined(values.userId),
      serviceId: toNumberOrUndefined(values.serviceId),
      barberId: toNumberOrUndefined(values.barberId),
      date: toOptionalString(values.date),
      time: toOptionalString(values.time),
    };
  },
};

const reviewsConfig: ResourceConfig = {
  key: "reviews",
  route: "/reviews",
  title: "Отзывы",
  description: "Отзывы клиентов и рейтинг барберов.",
  adapter: createCrudAdapter({
    key: "reviews",
    label: "Reviews",
    basePath: "/api/admin/reviews",
    idKeys: ["id"],
    supportsServerPagination: true,
  }),
  columns: [
    { key: "id", label: "ID", dataType: "number", sortable: true, width: "80px" },
    { key: "barber_id", label: "Barber", dataType: "number", sortable: true, width: "90px" },
    { key: "user_id", label: "User", dataType: "number", sortable: true, width: "90px" },
    { key: "author_name", label: "Автор", sortable: true },
    { key: "rating", label: "Рейтинг", dataType: "number", sortable: true, width: "90px" },
    { key: "comment", label: "Комментарий" },
    { key: "created_at", label: "Создан", dataType: "datetime", sortable: true },
  ],
  fields: [
    { key: "barberId", entityKey: "barber_id", label: "Barber ID", kind: "number", required: true, min: 1 },
    { key: "userId", entityKey: "user_id", label: "User ID", kind: "number", min: 1 },
    { key: "authorName", entityKey: "author_name", label: "Автор", kind: "text" },
    { key: "rating", label: "Рейтинг", kind: "number", required: true, min: 1, max: 5, step: 0.1 },
    { key: "comment", label: "Комментарий", kind: "textarea", required: true, minLength: 2, maxLength: 100 },
  ],
  defaultSort: { key: "id", direction: "desc" },
  searchKeys: ["id", "barber_id", "user_id", "author_name", "comment"],
  createPayload(values) {
    const userId = toNumberOrUndefined(values.userId);
    return {
      barberId: Number(values.barberId),
      userId: typeof userId === "number" ? userId : null,
      authorName: toOptionalString(values.authorName),
      rating: Number(values.rating),
      comment: String(values.comment || ""),
    };
  },
  updatePayload(values) {
    const userId = toOptionalString(values.userId);
    return {
      barberId: toNumberOrUndefined(values.barberId),
      userId: userId === "" ? null : toNumberOrUndefined(values.userId),
      authorName: toOptionalString(values.authorName),
      rating: toNumberOrUndefined(values.rating),
      comment: toOptionalString(values.comment),
    };
  },
};

const cartItemsConfig: ResourceConfig = {
  key: "cart-items",
  route: "/cart-items",
  title: "Cart Items",
  description: "Серверная корзина пользователей.",
  adapter: createCrudAdapter({
    key: "cart-items",
    label: "Cart Items",
    basePath: "/api/admin/cart-items",
    idKeys: ["userId", "productId"],
    supportsServerPagination: true,
  }),
  columns: [
    { key: "user_id", label: "User ID", dataType: "number", sortable: true, width: "95px" },
    { key: "product_id", label: "Product ID", dataType: "number", sortable: true, width: "100px" },
    { key: "quantity", label: "Qty", dataType: "number", sortable: true, width: "90px" },
    { key: "user_full_name", label: "Пользователь", sortable: true },
    { key: "product_name", label: "Товар", sortable: true },
    { key: "updated_at", label: "Обновлен", dataType: "datetime", sortable: true },
  ],
  fields: [
    { key: "userId", entityKey: "user_id", label: "User ID", kind: "number", required: true, min: 1 },
    { key: "productId", entityKey: "product_id", label: "Product ID", kind: "number", required: true, min: 1 },
    { key: "quantity", label: "Количество", kind: "number", required: true, min: 1 },
  ],
  defaultSort: { key: "updated_at", direction: "desc" },
  searchKeys: ["user_id", "product_id", "user_full_name", "product_name"],
  createPayload(values) {
    return {
      userId: Number(values.userId),
      productId: Number(values.productId),
      quantity: Number(values.quantity),
    };
  },
  updatePayload(values) {
    return {
      quantity: Number(values.quantity),
    };
  },
};

export const resourceConfigs: ResourceConfig[] = [
  adminsConfig,
  usersConfig,
  salonsConfig,
  barbersConfig,
  servicesConfig,
  productsConfig,
  slotsConfig,
  bookingsConfig,
  reviewsConfig,
  cartItemsConfig,
];

export const resourceConfigByRoute = new Map(resourceConfigs.map((item) => [item.route, item]));
export const resourceConfigByKey = new Map(resourceConfigs.map((item) => [item.key, item]));

export function getResourceConfig(route: string) {
  return resourceConfigByRoute.get(route) || null;
}

export function getResourceConfigByKey(key: string) {
  return resourceConfigByKey.get(key) || null;
}

export function sanitizePayload(payload: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "undefined") continue;
    if (typeof value === "string" && !value.trim()) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

export function withSalonOptions(config: ResourceConfig, salons: { id: number; name: string }[]) {
  if (config.key !== "barbers") return config;
  return {
    ...config,
    fields: config.fields.map((field) => {
      if (field.key !== "salonId") return field;
      return {
        ...field,
        options: [{ label: "Не выбран", value: "" }, ...salons.map((item) => ({ label: `${item.id} - ${item.name}`, value: item.id }))],
      };
    }),
  };
}

export function withBarberOptions(config: ResourceConfig, barbers: { id: number; name: string }[]) {
  if (config.key !== "slots") return config;
  return {
    ...config,
    fields: config.fields.map((field) => {
      if (field.key !== "barberId") return field;
      return {
        ...field,
        options: barbers.map((item) => ({ label: `${item.id} - ${item.name}`, value: item.id })),
      };
    }),
  };
}

export function toIdRecord(config: ResourceConfig, row: FormValues): Record<string, string | number> {
  const ids: Record<string, string | number> = {};
  for (const key of config.adapter.idKeys) {
    if (key in row) {
      ids[key] = String(row[key] ?? "");
      continue;
    }
    const snake = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (snake in row) ids[key] = String(row[snake] ?? "");
  }
  return ids;
}
