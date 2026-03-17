import master1 from "@/assets/master-1.jpg";
import master2 from "@/assets/master-2.jpg";
import master3 from "@/assets/master-3.jpg";
import master4 from "@/assets/master-4.jpg";

export interface Master {
  id: string;
  name: string;
  role: string;
  experience: string;
  rating: number;
  reviews: number;
  image: string;
  available: boolean;
  specialties: string[];
  location: string;
}

export const masters: Master[] = [
  {
    id: "1",
    name: "Алексей Ривера",
    role: "Барбер",
    experience: "8 лет",
    rating: 4.9,
    reviews: 342,
    image: master1,
    available: true,
    specialties: ["Мужские стрижки", "Бритьё", "Укладка"],
    location: "Центр",
  },
  {
    id: "2",
    name: "Марина Козлова",
    role: "Стилист",
    experience: "12 лет",
    rating: 5.0,
    reviews: 518,
    image: master2,
    available: true,
    specialties: ["Женские стрижки", "Укладка", "Уход"],
    location: "Центр",
  },
  {
    id: "3",
    name: "Даниил Волков",
    role: "Барбер",
    experience: "5 лет",
    rating: 4.8,
    reviews: 189,
    image: master3,
    available: false,
    specialties: ["Мужские стрижки", "Дизайн бороды"],
    location: "Север",
  },
  {
    id: "4",
    name: "Елена Морозова",
    role: "Колорист",
    experience: "10 лет",
    rating: 4.9,
    reviews: 427,
    image: master4,
    available: true,
    specialties: ["Окрашивание", "Мелирование", "Балаяж"],
    location: "Юг",
  },
];
