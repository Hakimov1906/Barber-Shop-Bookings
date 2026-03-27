export interface Salon {
  id: string;
  code: string;
  name: string;
  address: string;
  workHours: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  sortOrder: number;
}

export const salons: Salon[] = [
  {
    id: "1",
    code: "center",
    name: "HairLine Center",
    address: "Chuy Ave, 150",
    workHours: "09:00 - 21:00",
    latitude: 42.876731,
    longitude: 74.606215,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "2",
    code: "north",
    name: "HairLine North",
    address: "Jibek Jolu, 42",
    workHours: "10:00 - 20:00",
    latitude: 42.889112,
    longitude: 74.628954,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "3",
    code: "south",
    name: "HairLine South",
    address: "Akhunbaev St, 98",
    workHours: "09:00 - 21:00",
    latitude: 42.833481,
    longitude: 74.602614,
    isActive: true,
    sortOrder: 3,
  },
];
