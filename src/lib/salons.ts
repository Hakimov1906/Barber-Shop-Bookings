import type { Salon } from "@/data/salons";
import type { ApiSalon } from "@/lib/api";

export function mapApiSalonsToSalons(items: ApiSalon[]): Salon[] {
  if (!items.length) return [];

  return items.map((item) => ({
    id: String(item.id),
    code: item.code,
    name: item.name,
    address: item.address,
    workHours: item.work_hours,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    isActive: Boolean(item.is_active),
    sortOrder: Number(item.sort_order || 0),
  }));
}
