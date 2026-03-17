import master1 from "@/assets/master-1.jpg";
import master2 from "@/assets/master-2.jpg";
import master3 from "@/assets/master-3.jpg";
import master4 from "@/assets/master-4.jpg";
import portfolio1 from "@/assets/portfolio-1.jpg";
import portfolio2 from "@/assets/portfolio-2.jpg";
import portfolio3 from "@/assets/portfolio-3.jpg";
import portfolio4 from "@/assets/portfolio-4.jpg";
import portfolio5 from "@/assets/portfolio-5.jpg";
import portfolio6 from "@/assets/portfolio-6.jpg";

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

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
  bio: string;
  portfolio: string[];
  clientReviews: Review[];
}

export const masters: Master[] = [
  {
    id: "1",
    name: "Азамат Жусупов",
    role: "Барбер",
    experience: "8 жыл",
    rating: 4.9,
    reviews: 342,
    image: master1,
    available: true,
    specialties: ["Мужские стрижки", "Бритьё", "Укладка"],
    location: "Центр",
    bio: "Бишкектеги эң тажрыйбалуу барберлердин бири. Классикалык жана заманбап стилдерди өздөштүргөн. Ар бир кардарга жеке мамиле кылат.",
    portfolio: [portfolio1, portfolio3, portfolio6],
    clientReviews: [
      { id: "r1", author: "Бекзат М.", rating: 5, text: "Эң мыкты барбер! Ар дайым ушул жерге келем. Стрижка идеалдуу болот.", date: "2024-12-15" },
      { id: "r2", author: "Нурлан К.", rating: 5, text: "Борода дизайны абдан жакшы чыкты. Достормо да сунуштадым.", date: "2024-11-28" },
      { id: "r3", author: "Айбек Т.", rating: 4, text: "Жакшы мастер, бирок кезек бир аз узун болот.", date: "2024-11-10" },
    ],
  },
  {
    id: "2",
    name: "Айгүл Сатыбалдиева",
    role: "Стилист",
    experience: "12 жыл",
    rating: 5.0,
    reviews: 518,
    image: master2,
    available: true,
    specialties: ["Женские стрижки", "Укладка", "Уход"],
    location: "Центр",
    bio: "12 жылдык тажрыйбасы менен Айгүл — Бишкектеги эң популярдуу стилист. Той жана салтанаттуу тарануулар боюнча эксперт.",
    portfolio: [portfolio2, portfolio4, portfolio5],
    clientReviews: [
      { id: "r4", author: "Жибек А.", rating: 5, text: "Тоюмда тарануу жасатып, абдан ыраазы болдум! Бардыгы суктанышты.", date: "2024-12-20" },
      { id: "r5", author: "Назгүл Б.", rating: 5, text: "Ар дайым Айгүлгө гана барам. Чач кесүүсү укмуштуудай.", date: "2024-12-05" },
      { id: "r6", author: "Алтынай С.", rating: 5, text: "Чачымды ушунчалык сонун кылды, баарыга сунуштайм!", date: "2024-11-22" },
    ],
  },
  {
    id: "3",
    name: "Данияр Касымов",
    role: "Барбер",
    experience: "5 жыл",
    rating: 4.8,
    reviews: 189,
    image: master3,
    available: false,
    specialties: ["Мужские стрижки", "Дизайн бороды"],
    location: "Север",
    bio: "Жаш жана талантуу барбер. Заманбап стрижкалар жана борода дизайны боюнча адис. Жаштар стилин жакшы билет.",
    portfolio: [portfolio1, portfolio6, portfolio3],
    clientReviews: [
      { id: "r7", author: "Эрлан Д.", rating: 5, text: "Данияр — мыкты барбер! Фейд стрижкасы абдан таза чыгат.", date: "2024-12-01" },
      { id: "r8", author: "Тимур О.", rating: 4, text: "Жакшы мастер, стили заманбап.", date: "2024-11-15" },
    ],
  },
  {
    id: "4",
    name: "Элнура Токтосунова",
    role: "Колорист",
    experience: "10 жыл",
    rating: 4.9,
    reviews: 427,
    image: master4,
    available: true,
    specialties: ["Окрашивание", "Мелирование", "Балаяж"],
    location: "Юг",
    bio: "Кыргызстандагы эң мыкты колористтердин бири. Балаяж жана заманбап боёо техникалары боюнча сертификаттуу адис.",
    portfolio: [portfolio2, portfolio5, portfolio4],
    clientReviews: [
      { id: "r9", author: "Миргүл К.", rating: 5, text: "Балаяж абдан натуралдуу чыкты! Элнура — чыныгы профессионал.", date: "2024-12-18" },
      { id: "r10", author: "Бегимай Н.", rating: 5, text: "Чачымды боёгондон кийин баары суктанды. Рахмат!", date: "2024-12-10" },
      { id: "r11", author: "Айжамал Р.", rating: 4, text: "Сапаттуу иш, бирок баасы бир аз кымбат.", date: "2024-11-30" },
    ],
  },
];
