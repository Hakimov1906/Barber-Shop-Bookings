import { client, HttpApiError, unwrapOpenApiResponse } from "@/api/client";
import type { components } from "@/api/generated/openapi";
import { masters } from "@/data/masters";
import { products as seedProducts } from "@/data/products";
import { salons as seedSalons } from "@/data/salons";
import { services as seedServices } from "@/data/services";
import {
  API_BASE_URL,
  MAX_ACTIVE_BOOKINGS_PER_USER,
  USE_MOCK_API,
} from "@/lib/config";

export type ApiBarber = components["schemas"]["Barber"];
export type ApiService = components["schemas"]["Service"];
export type ApiProduct = components["schemas"]["Product"];
export type ApiSlot = components["schemas"]["Slot"];
export type ApiUser = components["schemas"]["UserPublic"];
export type ApiBookingResponse = components["schemas"]["BookingCreatedResponse"];
export type ApiReview = components["schemas"]["Review"];
export type ApiSalon = components["schemas"]["Salon"];
export type ApiCartItem = components["schemas"]["CartItem"];
export interface ApiUserProfileResponse {
  user: ApiUser;
}
export interface ApiMyBooking {
  id: number;
  service_id: number;
  service_name: string;
  service_price: string;
  barber_id: number;
  barber_name: string;
  salon_id: number;
  salon_name: string;
  salon_address: string;
  date: string;
  time: string;
  created_at: string;
}
type RegisterResponse = components["schemas"]["RegisterResponse"];
type LoginResponse = components["schemas"]["UserLoginResponse"];
type RegisterRequest = components["schemas"]["RegisterRequest"];
type LoginRequest = components["schemas"]["UserLoginRequest"];
type BookingRequest = components["schemas"]["BookingRequest"];
type ReviewCreateRequest = components["schemas"]["ReviewCreateRequest"];
type ReviewCreateResponse = components["schemas"]["ReviewCreateResponse"];
type UserPasswordUpdateRequest = components["schemas"]["UserPasswordUpdateRequest"];
type UserPasswordUpdateResponse = components["schemas"]["UserPasswordUpdateResponse"];
type CartResponse = components["schemas"]["CartResponse"];
type CartItemUpsertRequest = components["schemas"]["CartItemUpsertRequest"];
type CartStatusResponse = components["schemas"]["CartStatusResponse"];
type UpdateProfileRequest = {
  fullName?: string;
  phone?: string;
};

interface MockUserRecord {
  id: number;
  fullName: string;
  phone: string;
  password: string;
  createdAt: string;
}

interface MockBookingRecord {
  id: number;
  userId: number;
  serviceId: number;
  barberId: number;
  date: string;
  time: string;
  createdAt: string;
}

interface MockReviewRecord {
  id: number;
  barberId: number;
  userId: number | null;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface MockCartItemRecord {
  productId: number;
  quantity: number;
}

const MOCK_USERS_KEY = "hairline-mock-users";
const MOCK_BOOKINGS_KEY = "hairline-mock-bookings";
const MOCK_REVIEWS_KEY = "hairline-mock-reviews";
const MOCK_CART_KEY = "hairline-mock-cart";
const KG_PHONE_REGEX = /^\+996\d{9}$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 50;
const MAX_REVIEW_COMMENT_LENGTH = 150;
const MOCK_SLOT_TIMES = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function toApiError(error: unknown): never {
  if (error instanceof ApiError) {
    throw error;
  }
  if (error instanceof HttpApiError) {
    throw new ApiError(error.message, error.status);
  }
  throw error;
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? String((payload as { error: string }).error)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

const wait = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

function parseMinutes(duration: string): number {
  const match = duration.match(/\d+/);
  if (!match) return 30;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

function parseYears(value: string): number {
  const match = value.match(/\d+/);
  if (!match) return 1;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function toDateTime(date: string, time: string): Date | null {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const parsed = new Date(`${date}T${normalizedTime}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function loadMockUsers(): MockUserRecord[] {
  const raw = localStorage.getItem(MOCK_USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as MockUserRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMockUsers(users: MockUserRecord[]) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

function loadMockBookings(): MockBookingRecord[] {
  const raw = localStorage.getItem(MOCK_BOOKINGS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as MockBookingRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMockBookings(bookings: MockBookingRecord[]) {
  localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
}

function loadMockReviews(): MockReviewRecord[] {
  const raw = localStorage.getItem(MOCK_REVIEWS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as MockReviewRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMockReviews(reviews: MockReviewRecord[]) {
  localStorage.setItem(MOCK_REVIEWS_KEY, JSON.stringify(reviews));
}

function loadMockCartByUser(): Record<string, MockCartItemRecord[]> {
  const raw = localStorage.getItem(MOCK_CART_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, MockCartItemRecord[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveMockCartByUser(cart: Record<string, MockCartItemRecord[]>) {
  localStorage.setItem(MOCK_CART_KEY, JSON.stringify(cart));
}

function getMockProductsById() {
  const index = new Map<number, ApiProduct>();
  seedProducts.forEach((product, productIndex) => {
    index.set(Number(product.id) || productIndex + 1, {
      id: Number(product.id) || productIndex + 1,
      name: product.name,
      description: product.description,
      price: String(product.price),
      image_url: product.image,
      category: product.category,
      type: product.type,
      stock_qty: 100,
    });
  });
  return index;
}

function ensureMockReviewsSeeded() {
  if (localStorage.getItem(MOCK_REVIEWS_KEY)) {
    return;
  }

  const seeded = masters.flatMap((master) =>
    master.clientReviews.map((review, index) => ({
      id: Number.parseInt(review.id.replace(/[^\d]/g, ""), 10) || Number(`${master.id}${index + 1}`),
      barberId: Number(master.id),
      userId: null,
      authorName: review.author,
      rating: review.rating,
      comment: review.text,
      createdAt: new Date(review.date).toISOString(),
    })),
  );

  saveMockReviews(seeded);
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function toMockToken(userId: number) {
  return `mock-token-${userId}`;
}

function fromMockToken(token: string): number | null {
  if (!token.startsWith("mock-token-")) return null;
  const value = Number(token.replace("mock-token-", ""));
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

const mockApi = {
  getSalons: async (): Promise<ApiSalon[]> => {
    await wait();
    const now = new Date().toISOString();
    return seedSalons.map((salon, index) => ({
      id: Number(salon.id) || index + 1,
      code: salon.code,
      name: salon.name,
      address: salon.address,
      work_hours: salon.workHours,
      latitude: salon.latitude,
      longitude: salon.longitude,
      is_active: salon.isActive,
      sort_order: salon.sortOrder,
      created_at: now,
      updated_at: now,
    }));
  },
  getBarbers: async (salonId?: number): Promise<ApiBarber[]> => {
    await wait();
    const now = new Date().toISOString();
    const items = masters.map((master, index) => {
      const salon =
        seedSalons.find((item) => item.code === master.salonCode) ||
        seedSalons.find((item) => item.id === master.salonId);
      const resolvedSalonId = Number(master.salonId) || Number(salon?.id) || 0;
      return {
        id: Number(master.id) || index + 1,
        name: master.name,
        role: master.role,
        experience_years: parseYears(master.experience),
        rating: master.rating,
        reviews_count: master.reviews,
        image_url: master.image,
        is_available: master.available,
        specialties: master.specialties,
        salon_id: resolvedSalonId,
        salon: {
          id: resolvedSalonId,
          code: salon?.code || master.salonCode,
          name: salon?.name || master.salonName,
          address: salon?.address || master.salonAddress,
          work_hours: salon?.workHours || "09:00 - 21:00",
          latitude: salon?.latitude ?? 0,
          longitude: salon?.longitude ?? 0,
          is_active: salon?.isActive ?? true,
          sort_order: salon?.sortOrder ?? 0,
          created_at: now,
          updated_at: now,
        },
        bio: master.bio,
        is_active: true,
        created_at: now,
      };
    });

    if (typeof salonId === "number") {
      return items.filter((master) => master.salon_id === salonId);
    }

    return items;
  },
  getServices: async (): Promise<ApiService[]> => {
    await wait();
    return seedServices.map((service, index) => ({
      id: index + 1,
      name: service.name,
      duration_minutes: parseMinutes(service.duration),
      price: String(service.price),
    }));
  },
  getProducts: async (): Promise<ApiProduct[]> => {
    await wait();
    return seedProducts.map((product, index) => ({
      id: Number(product.id) || index + 1,
      name: product.name,
      description: product.description,
      price: String(product.price),
      image_url: product.image,
      category: product.category,
      type: product.type,
      stock_qty: 100,
    }));
  },
  getSlots: async (date: string, barberId: number): Promise<ApiSlot[]> => {
    await wait();
    const booked = new Set(
      loadMockBookings()
        .filter((booking) => booking.date === date && booking.barberId === barberId)
        .map((booking) => booking.time.slice(0, 5)),
    );

    return MOCK_SLOT_TIMES.filter((time) => !booked.has(time)).map((time, index) => ({
      id: barberId * 1000 + index + 1,
      barber_id: barberId,
      date,
      time,
      status: "available",
    }));
  },
  register: async (body: RegisterRequest): Promise<RegisterResponse> => {
    await wait();
    const users = loadMockUsers();
    const fullName = body.fullName.trim();
    const phone = body.phone.trim();
    const passwordLength = body.password.length;

    if (
      fullName.length < 2 ||
      fullName.length > 120 ||
      !KG_PHONE_REGEX.test(phone) ||
      passwordLength < MIN_PASSWORD_LENGTH ||
      passwordLength > MAX_PASSWORD_LENGTH
    ) {
      throw new ApiError("Invalid payload", 400);
    }

    const exists = users.some((user) => user.phone === phone);
    if (exists) {
      throw new ApiError("User already exists", 409);
    }

    const nextId = users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
    const createdAt = new Date().toISOString();
    const created: MockUserRecord = {
      id: nextId,
      fullName,
      phone,
      password: body.password,
      createdAt,
    };
    users.push(created);
    saveMockUsers(users);

    return {
      user: {
        id: created.id,
        full_name: created.fullName,
        phone: created.phone,
        created_at: created.createdAt,
      },
    };
  },
  login: async (body: LoginRequest): Promise<LoginResponse> => {
    await wait();
    const users = loadMockUsers();
    const phone = body.phone.trim();
    if (!KG_PHONE_REGEX.test(phone) || !body.password?.length) {
      throw new ApiError("Invalid payload", 400);
    }
    const found = users.find((user) => user.phone === phone);

    if (!found || found.password !== body.password) {
      throw new ApiError("Invalid credentials", 401);
    }

    return {
      token: toMockToken(found.id),
      user: {
        id: found.id,
        fullName: found.fullName,
        phone: found.phone,
      },
    };
  },
  createBooking: async (
    token: string,
    body: BookingRequest,
  ): Promise<ApiBookingResponse> => {
    await wait();
    const userId = fromMockToken(token);
    if (!userId) {
      throw new ApiError("Invalid token", 401);
    }

    const bookings = loadMockBookings();
    const conflict = bookings.some(
      (booking) =>
        booking.barberId === body.barberId &&
        booking.date === body.date &&
        booking.time.slice(0, 5) === body.time.slice(0, 5),
    );

    if (conflict) {
      throw new ApiError("Selected time slot is not available", 409);
    }

    const now = new Date();
    const activeBookingsCount = bookings.filter((booking) => {
      if (booking.userId !== userId) return false;
      const startsAt = toDateTime(booking.date, booking.time);
      return startsAt ? startsAt.getTime() >= now.getTime() : false;
    }).length;
    if (activeBookingsCount >= MAX_ACTIVE_BOOKINGS_PER_USER) {
      throw new ApiError(
        `Maximum ${MAX_ACTIVE_BOOKINGS_PER_USER} active bookings per user reached`,
        409,
      );
    }

    const nextId = bookings.reduce((max, booking) => Math.max(max, booking.id), 0) + 1;
    const createdAt = new Date().toISOString();
    bookings.push({
      id: nextId,
      userId,
      serviceId: body.serviceId,
      barberId: body.barberId,
      date: body.date,
      time: body.time.slice(0, 5),
      createdAt,
    });
    saveMockBookings(bookings);

    return { id: nextId, createdAt };
  },
  getMyBookings: async (token: string): Promise<ApiMyBooking[]> => {
    await wait();
    const userId = fromMockToken(token);
    if (!userId) {
      throw new ApiError("Invalid token", 401);
    }

    const bookings = loadMockBookings()
      .filter((booking) => booking.userId === userId)
      .sort(
        (a, b) =>
          Date.parse(`${b.date}T${b.time}:00`) - Date.parse(`${a.date}T${a.time}:00`),
      );

    return bookings.map((booking) => {
      const service = seedServices.find(
        (_, index) => index + 1 === booking.serviceId,
      );
      const barber = masters.find((master) => Number(master.id) === booking.barberId);
      return {
        id: booking.id,
        service_id: booking.serviceId,
        service_name: service?.name ?? `Service #${booking.serviceId}`,
        service_price: String(service?.price ?? 0),
        barber_id: booking.barberId,
        barber_name: barber?.name ?? `Barber #${booking.barberId}`,
        salon_id: Number(barber?.salonId || 0),
        salon_name: barber?.salonName || "Salon not assigned",
        salon_address: barber?.salonAddress || "",
        date: booking.date,
        time: `${booking.time.slice(0, 5)}:00`,
        created_at: booking.createdAt,
      };
    });
  },
  getMyReviews: async (token: string): Promise<ApiReview[]> => {
    await wait();
    const userId = fromMockToken(token);
    if (!userId) {
      throw new ApiError("Invalid token", 401);
    }

    ensureMockReviewsSeeded();
    return loadMockReviews()
      .filter((review) => review.userId === userId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map((review) => ({
        id: review.id,
        barber_id: review.barberId,
        author_name: review.authorName,
        rating: review.rating,
        comment: review.comment,
        created_at: review.createdAt,
      }));
  },
  cancelBooking: async (token: string, bookingId: number): Promise<{ status: string }> => {
    await wait();
    const userId = fromMockToken(token);
    if (!userId) {
      throw new ApiError("Invalid token", 401);
    }

    const bookings = loadMockBookings();
    const index = bookings.findIndex(
      (booking) => booking.id === bookingId && booking.userId === userId,
    );
    if (index === -1) {
      throw new ApiError("Booking not found", 404);
    }

    bookings.splice(index, 1);
    saveMockBookings(bookings);
    return { status: "cancelled" };
  },
  updateProfile: async (
    token: string,
    body: UpdateProfileRequest,
  ): Promise<ApiUserProfileResponse> => {
    await wait();
    const userId = fromMockToken(token);
    if (!userId) {
      throw new ApiError("Invalid token", 401);
    }

    const users = loadMockUsers();
    const target = users.find((user) => user.id === userId);
    if (!target) {
      throw new ApiError("User not found", 404);
    }

    if (typeof body.fullName !== "undefined") {
      const fullName = body.fullName.trim();
      if (fullName.length < 2 || fullName.length > 120) {
        throw new ApiError("Invalid payload", 400);
      }
    }

    const phone = body.phone?.trim();
    if (phone && !KG_PHONE_REGEX.test(phone)) {
      throw new ApiError("Invalid payload", 400);
    }

    if (phone && users.some((user) => user.id !== userId && user.phone === phone)) {
      throw new ApiError("Phone already in use", 409);
    }

    if (body.fullName) {
      target.fullName = body.fullName.trim();
    }
    if (phone) {
      target.phone = phone;
    }

    saveMockUsers(users);
    return {
      user: {
        id: target.id,
        full_name: target.fullName,
        phone: target.phone,
        created_at: target.createdAt ?? new Date().toISOString(),
      },
    };
  },
  updatePassword: async (
    token: string,
    body: UserPasswordUpdateRequest,
  ): Promise<UserPasswordUpdateResponse> => {
    await wait();
    const userId = fromMockToken(token);
    if (!userId) {
      throw new ApiError("Invalid token", 401);
    }

    if (!body.currentPassword?.trim() || (body.newPassword?.length ?? 0) < 6) {
      throw new ApiError("Invalid payload", 400);
    }
    if ((body.newPassword?.length ?? 0) > 50) {
      throw new ApiError("Invalid payload", 400);
    }

    const users = loadMockUsers();
    const target = users.find((user) => user.id === userId);
    if (!target) {
      throw new ApiError("User not found", 401);
    }
    if (target.password !== body.currentPassword) {
      throw new ApiError("Current password is incorrect", 400);
    }

    target.password = body.newPassword;
    saveMockUsers(users);

    return { status: "password_updated" };
  },
  getMyCart: async (token: string): Promise<CartResponse> => {
    await wait();
    const userId = fromMockToken(token);
    if (!userId) {
      throw new ApiError("Invalid token", 401);
    }

    const cartByUser = loadMockCartByUser();
    const userCart = cartByUser[String(userId)] || [];
    const productIndex = getMockProductsById();
    const items = userCart
      .map((item) => {
        const product = productIndex.get(item.productId);
        if (!product) return null;
        return {
          product_id: product.id,
          quantity: item.quantity,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
        };
      })
      .filter((item): item is ApiCartItem => Boolean(item));

    return { items };
  },
  setMyCartItem: async (
    token: string,
    productId: number,
    body: CartItemUpsertRequest,
  ): Promise<CartStatusResponse> => {
    await wait();
    const userId = fromMockToken(token);
    if (!userId) {
      throw new ApiError("Invalid token", 401);
    }
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new ApiError("Invalid product id", 400);
    }
    if (!Number.isInteger(body.quantity) || body.quantity <= 0) {
      throw new ApiError("Invalid quantity", 400);
    }

    const productIndex = getMockProductsById();
    if (!productIndex.has(productId)) {
      throw new ApiError("Product not found", 404);
    }

    const cartByUser = loadMockCartByUser();
    const key = String(userId);
    const userCart = [...(cartByUser[key] || [])];
    const itemIndex = userCart.findIndex((item) => item.productId === productId);
    if (itemIndex >= 0) {
      userCart[itemIndex] = {
        productId,
        quantity: body.quantity,
      };
    } else {
      userCart.push({ productId, quantity: body.quantity });
    }
    cartByUser[key] = userCart;
    saveMockCartByUser(cartByUser);
    return { status: "updated" };
  },
  removeMyCartItem: async (token: string, productId: number): Promise<CartStatusResponse> => {
    await wait();
    const userId = fromMockToken(token);
    if (!userId) {
      throw new ApiError("Invalid token", 401);
    }
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new ApiError("Invalid product id", 400);
    }

    const cartByUser = loadMockCartByUser();
    const key = String(userId);
    const userCart = cartByUser[key] || [];
    cartByUser[key] = userCart.filter((item) => item.productId !== productId);
    saveMockCartByUser(cartByUser);
    return { status: "removed" };
  },
  clearMyCart: async (token: string): Promise<CartStatusResponse> => {
    await wait();
    const userId = fromMockToken(token);
    if (!userId) {
      throw new ApiError("Invalid token", 401);
    }

    const cartByUser = loadMockCartByUser();
    delete cartByUser[String(userId)];
    saveMockCartByUser(cartByUser);
    return { status: "cleared" };
  },
  getBarberReviews: async (barberId: number): Promise<ApiReview[]> => {
    await wait();
    ensureMockReviewsSeeded();
    return loadMockReviews()
      .filter((review) => review.barberId === barberId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map((review) => ({
        id: review.id,
        barber_id: review.barberId,
        author_name: review.authorName,
        rating: review.rating,
        comment: review.comment,
        created_at: review.createdAt,
      }));
  },
  createBarberReview: async (
    token: string,
    barberId: number,
    body: ReviewCreateRequest,
  ): Promise<ReviewCreateResponse> => {
    await wait();
    const userId = fromMockToken(token);
    if (!userId) {
      throw new ApiError("Invalid token", 401);
    }

    const comment = body.comment.trim();
    if (
      !Number.isInteger(body.rating) ||
      body.rating < 1 ||
      body.rating > 5 ||
      comment.length < 5 ||
      comment.length > MAX_REVIEW_COMMENT_LENGTH
    ) {
      throw new ApiError("Invalid payload", 400);
    }

    const user = loadMockUsers().find((item) => item.id === userId);
    if (!user) {
      throw new ApiError("User not found", 401);
    }

    const hasBooking = loadMockBookings().some(
      (booking) => booking.userId === userId && booking.barberId === barberId,
    );
    if (!hasBooking) {
      throw new ApiError("Only clients with booking can leave a review", 403);
    }

    ensureMockReviewsSeeded();
    const reviews = loadMockReviews();
    const now = new Date().toISOString();
    const existing = reviews.find(
      (review) => review.barberId === barberId && review.userId === userId,
    );

    let saved: MockReviewRecord;
    if (existing) {
      existing.rating = body.rating;
      existing.comment = comment;
      existing.createdAt = now;
      existing.authorName = user.fullName;
      saved = existing;
    } else {
      const nextId = reviews.reduce((max, review) => Math.max(max, review.id), 0) + 1;
      saved = {
        id: nextId,
        barberId,
        userId,
        authorName: user.fullName,
        rating: body.rating,
        comment,
        createdAt: now,
      };
      reviews.push(saved);
    }

    saveMockReviews(reviews);

    const barberReviews = reviews.filter((review) => review.barberId === barberId);
    const rating =
      barberReviews.length > 0
        ? roundToSingleDecimal(
            barberReviews.reduce((sum, review) => sum + review.rating, 0) / barberReviews.length,
          )
        : 0;

    return {
      review: {
        id: saved.id,
        barber_id: saved.barberId,
        author_name: saved.authorName,
        rating: saved.rating,
        comment: saved.comment,
        created_at: saved.createdAt,
      },
      barber: {
        id: barberId,
        rating,
        reviews_count: barberReviews.length,
      },
    };
  },
};

const realApi = {
  getSalons: async (): Promise<ApiSalon[]> => {
    try {
      return await requestJson<ApiSalon[]>("/api/salons");
    } catch (error) {
      return toApiError(error);
    }
  },
  getBarbers: async (salonId?: number): Promise<ApiBarber[]> => {
    try {
      if (typeof salonId === "number") {
        return await unwrapOpenApiResponse(
          client.GET("/api/barbers", {
            params: {
              query: {
                salonId,
              },
            },
          }),
        );
      }

      return await unwrapOpenApiResponse(client.GET("/api/barbers"));
    } catch (error) {
      return toApiError(error);
    }
  },
  getServices: async (): Promise<ApiService[]> => {
    try {
      return await unwrapOpenApiResponse(client.GET("/api/services"));
    } catch (error) {
      return toApiError(error);
    }
  },
  getProducts: async (): Promise<ApiProduct[]> => {
    try {
      return await unwrapOpenApiResponse(client.GET("/api/products"));
    } catch (error) {
      return toApiError(error);
    }
  },
  getSlots: async (date: string, barberId: number): Promise<ApiSlot[]> => {
    try {
      return await unwrapOpenApiResponse(
        client.GET("/api/slots", {
          params: {
            query: {
              date,
              barberId,
            },
          },
        }),
      );
    } catch (error) {
      return toApiError(error);
    }
  },
  register: async (body: RegisterRequest): Promise<RegisterResponse> => {
    try {
      return await unwrapOpenApiResponse(
        client.POST("/api/auth/register", {
          body,
        }),
      );
    } catch (error) {
      return toApiError(error);
    }
  },
  login: async (body: LoginRequest): Promise<LoginResponse> => {
    try {
      return await unwrapOpenApiResponse(
        client.POST("/api/auth/login", {
          body,
        }),
      );
    } catch (error) {
      return toApiError(error);
    }
  },
  createBooking: async (
    token: string,
    body: BookingRequest,
  ): Promise<ApiBookingResponse> => {
    try {
      return await unwrapOpenApiResponse(
        client.POST("/api/bookings", {
          body,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    } catch (error) {
      return toApiError(error);
    }
  },
  getMyBookings: async (token: string): Promise<ApiMyBooking[]> => {
    try {
      return await requestJson<ApiMyBooking[]>("/api/bookings/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      return toApiError(error);
    }
  },
  getMyReviews: async (token: string): Promise<ApiReview[]> => {
    try {
      return [];
    } catch (error) {
      return toApiError(error);
    }
  },
  cancelBooking: async (
    token: string,
    bookingId: number,
  ): Promise<{ status: string }> => {
    try {
      return await requestJson<{ status: string }>(`/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      return toApiError(error);
    }
  },
  updateProfile: async (
    token: string,
    body: UpdateProfileRequest,
  ): Promise<ApiUserProfileResponse> => {
    try {
      return await requestJson<ApiUserProfileResponse>("/api/users/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      return toApiError(error);
    }
  },
  updatePassword: async (
    token: string,
    body: UserPasswordUpdateRequest,
  ): Promise<UserPasswordUpdateResponse> => {
    try {
      return await requestJson<UserPasswordUpdateResponse>("/api/users/me/password", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      return toApiError(error);
    }
  },
  getMyCart: async (token: string): Promise<CartResponse> => {
    try {
      return await requestJson<CartResponse>("/api/cart/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      return toApiError(error);
    }
  },
  setMyCartItem: async (
    token: string,
    productId: number,
    body: CartItemUpsertRequest,
  ): Promise<CartStatusResponse> => {
    try {
      return await requestJson<CartStatusResponse>(`/api/cart/me/items/${productId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      return toApiError(error);
    }
  },
  removeMyCartItem: async (
    token: string,
    productId: number,
  ): Promise<CartStatusResponse> => {
    try {
      return await requestJson<CartStatusResponse>(`/api/cart/me/items/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      return toApiError(error);
    }
  },
  clearMyCart: async (token: string): Promise<CartStatusResponse> => {
    try {
      return await requestJson<CartStatusResponse>("/api/cart/me", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      return toApiError(error);
    }
  },
  getBarberReviews: async (barberId: number): Promise<ApiReview[]> => {
    try {
      return await unwrapOpenApiResponse(
        client.GET("/api/barbers/{id}/reviews", {
          params: {
            path: {
              id: barberId,
            },
          },
        }),
      );
    } catch (error) {
      return toApiError(error);
    }
  },
  createBarberReview: async (
    token: string,
    barberId: number,
    body: ReviewCreateRequest,
  ): Promise<ReviewCreateResponse> => {
    try {
      return await unwrapOpenApiResponse(
        client.POST("/api/barbers/{id}/reviews", {
          params: {
            path: {
              id: barberId,
            },
          },
          body,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    } catch (error) {
      return toApiError(error);
    }
  },
};

export const api = USE_MOCK_API ? mockApi : realApi;
