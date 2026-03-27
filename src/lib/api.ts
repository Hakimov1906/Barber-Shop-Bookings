import { client, HttpApiError, unwrapOpenApiResponse } from "@/api/client";
import type { components } from "@/api/generated/openapi";
import { masters } from "@/data/masters";
import { products as seedProducts } from "@/data/products";
import { salons as seedSalons } from "@/data/salons";
import { services as seedServices } from "@/data/services";
import { API_BASE_URL, USE_MOCK_API } from "@/lib/config";

export type ApiBarber = components["schemas"]["Barber"];
export type ApiService = components["schemas"]["Service"];
export type ApiProduct = components["schemas"]["Product"];
export type ApiSlot = components["schemas"]["Slot"];
export type ApiUser = components["schemas"]["UserPublic"];
export type ApiBookingResponse = components["schemas"]["BookingCreatedResponse"];
export type ApiReview = components["schemas"]["Review"];
export type ApiSalon = components["schemas"]["Salon"];
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
type UpdateProfileRequest = {
  fullName?: string;
  email?: string;
  phone?: string;
};

interface MockUserRecord {
  id: number;
  fullName: string;
  email: string;
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

const MOCK_USERS_KEY = "hairline-mock-users";
const MOCK_BOOKINGS_KEY = "hairline-mock-bookings";
const MOCK_REVIEWS_KEY = "hairline-mock-reviews";
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
  getBarbers: async (): Promise<ApiBarber[]> => {
    await wait();
    return masters.map((master, index) => ({
      id: Number(master.id) || index + 1,
      name: master.name,
      role: master.role,
      experience_years: parseYears(master.experience),
      rating: master.rating,
      reviews_count: master.reviews,
      image_url: master.image,
      is_available: master.available,
      specialties: master.specialties,
      location: master.location,
      bio: master.bio,
      is_active: true,
      created_at: new Date().toISOString(),
    }));
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
    const email = body.email.trim().toLowerCase();
    const phone = body.phone.trim();

    const exists = users.some(
      (user) => user.email.toLowerCase() === email || user.phone === phone,
    );
    if (exists) {
      throw new ApiError("User already exists", 409);
    }

    const nextId = users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
    const createdAt = new Date().toISOString();
    const created: MockUserRecord = {
      id: nextId,
      fullName: body.fullName.trim(),
      email,
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
        email: created.email,
        phone: created.phone,
        created_at: created.createdAt,
      },
    };
  },
  login: async (body: LoginRequest): Promise<LoginResponse> => {
    await wait();
    const users = loadMockUsers();
    const email = body.email.trim().toLowerCase();
    const found = users.find((user) => user.email.toLowerCase() === email);

    if (!found || found.password !== body.password) {
      throw new ApiError("Invalid credentials", 401);
    }

    return {
      token: toMockToken(found.id),
      user: {
        id: found.id,
        fullName: found.fullName,
        email: found.email,
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
        date: booking.date,
        time: `${booking.time.slice(0, 5)}:00`,
        created_at: booking.createdAt,
      };
    });
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

    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();

    if (
      email &&
      users.some((user) => user.id !== userId && user.email.toLowerCase() === email)
    ) {
      throw new ApiError("Email or phone already in use", 409);
    }
    if (phone && users.some((user) => user.id !== userId && user.phone === phone)) {
      throw new ApiError("Email or phone already in use", 409);
    }

    if (body.fullName) {
      target.fullName = body.fullName.trim();
    }
    if (email) {
      target.email = email;
    }
    if (phone) {
      target.phone = phone;
    }

    saveMockUsers(users);
    return {
      user: {
        id: target.id,
        full_name: target.fullName,
        email: target.email,
        phone: target.phone,
        created_at: target.createdAt ?? new Date().toISOString(),
      },
    };
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
      existing.comment = body.comment.trim();
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
        comment: body.comment.trim(),
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
  getBarbers: async (): Promise<ApiBarber[]> => {
    try {
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
