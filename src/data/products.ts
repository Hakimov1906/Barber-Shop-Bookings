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
    name: "Шампунь для объёма",
    description: "Профессиональный шампунь для тонких волос. Придаёт объём и блеск.",
    price: 1890,
    image: product1,
    category: "unisex",
    type: "Уход",
  },
  {
    id: "2",
    name: "Крем для укладки",
    description: "Лёгкая фиксация с матовым финишем. Идеален для естественных текстур.",
    price: 2450,
    image: product2,
    category: "men",
    type: "Стайлинг",
  },
  {
    id: "3",
    name: "Масло для волос",
    description: "Питательное масло с аргановым экстрактом. Восстанавливает и защищает.",
    price: 3200,
    image: product3,
    category: "women",
    type: "Уход",
  },
  {
    id: "4",
    name: "Шампунь глубокой очистки",
    description: "Детокс-формула для жирных волос. Освежает и тонизирует кожу головы.",
    price: 1650,
    image: product4,
    category: "men",
    type: "Уход",
  },
  {
    id: "5",
    name: "Термозащитный спрей",
    description: "Защита от температуры до 230°C. Придаёт гладкость и блеск.",
    price: 2100,
    image: product1,
    category: "women",
    type: "Защита",
  },
  {
    id: "6",
    name: "Воск для бороды",
    description: "Средняя фиксация, натуральный состав. Ухаживает и придаёт форму.",
    price: 1450,
    image: product2,
    category: "men",
    type: "Стайлинг",
  },
];
