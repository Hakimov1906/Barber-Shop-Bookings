import { motion } from "framer-motion";
import type { Product } from "@/data/products";

const ProductCard = ({ product }: { product: Product }) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    className="group overflow-hidden rounded-2xl bg-card card-shadow transition-shadow duration-200 hover:card-shadow-hover"
  >
    <div className="aspect-square overflow-hidden bg-secondary">
      <img
        src={product.image}
        alt={product.name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
    </div>
    <div className="p-4">
      <p className="text-xs text-muted-foreground">{product.type}</p>
      <h3 className="mt-1 text-sm font-semibold tracking-tight">{product.name}</h3>
      <div className="mt-3 flex items-center justify-between">
        <span className="tabular text-sm font-semibold">{product.price.toLocaleString("ru-RU")} ₽</span>
        <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-primary/90 active:scale-95">
          В корзину
        </button>
      </div>
    </div>
  </motion.div>
);

export default ProductCard;
