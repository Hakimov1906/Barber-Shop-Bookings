import { useState } from "react";
import { motion } from "framer-motion";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";

type Gender = "all" | "men" | "women";

const Shop = () => {
  const [gender, setGender] = useState<Gender>("all");

  const filtered = products.filter((p) => {
    if (gender === "all") return true;
    return p.category === gender || p.category === "unisex";
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-semibold">Магазин</h1>
        <p className="mt-2 text-muted-foreground">Профессиональная продукция для домашнего ухода</p>
      </motion.div>

      {/* Gender toggle */}
      <div className="mt-8 inline-flex rounded-xl bg-secondary p-1">
        {([
          ["all", "Все"],
          ["men", "Мужчинам"],
          ["women", "Женщинам"],
        ] as [Gender, string][]).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setGender(value)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all duration-150 ${
              gender === value
                ? "bg-card text-foreground card-shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <ProductCard product={p} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
