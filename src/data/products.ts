import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "men" | "women" | "unisex";
  type: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Шампунь көлөм үчүн",
    description: "Ичке чачтар үчүн профессионалдуу шампунь. Көлөм жана жылтырак берет.",
    price: 650,
    image: product1,
    category: "unisex",
    type: "Күтүм",
  },
  {
    id: "2",
    name: "Укладка үчүн крем",
    description: "Жеңил фиксация матовый финиш менен. Табигый текстуралар үчүн идеалдуу.",
    price: 850,
    image: product2,
    category: "men",
    type: "Стайлинг",
  },
  {
    id: "3",
    name: "Чач майы",
    description: "Арган экстракты менен азыктандыруучу май. Калыбына келтирет жана коргойт.",
    price: 1100,
    image: product3,
    category: "women",
    type: "Күтүм",
  },
  {
    id: "4",
    name: "Терең тазалоочу шампунь",
    description: "Майлуу чачтар үчүн детокс-формула. Баш терисин жаңылайт.",
    price: 550,
    image: product4,
    category: "men",
    type: "Күтүм",
  },
  {
    id: "5",
    name: "Термокоргоо спрейи",
    description: "230°C чейин температурадан коргоо. Жылмакайлык жана жылтырак берет.",
    price: 750,
    image: product1,
    category: "women",
    type: "Коргоо",
  },
  {
    id: "6",
    name: "Сакал үчүн воск",
    description: "Орточо фиксация, табигый курам. Күтөт жана форма берет.",
    price: 480,
    image: product2,
    category: "men",
    type: "Стайлинг",
  },
];
