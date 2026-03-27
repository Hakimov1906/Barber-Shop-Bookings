import { useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { useI18n } from "@/lib/i18n";
import { useProducts } from "@/hooks/useProducts";

type Gender = "all" | "men" | "women";

const Shop = () => {
  const [gender, setGender] = useState<Gender>("all");
  const { tr, lang } = useI18n();
  const { products, isLoading, isFallback } = useProducts();

  const genderOptions: [Gender, string][] = [
    ["all", tr("shop.all")],
    ["men", tr("shop.men")],
    ["women", tr("shop.women")],
  ];

  const filtered = products.filter((p) => {
    if (gender === "all") return true;
    return p.category === gender || p.category === "unisex";
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-semibold">{tr("shop.title")}</h1>
        <p className="mt-2 text-muted-foreground">{tr("shop.subtitle")}</p>
        {isFallback && (
          <p className="mt-2 text-xs text-muted-foreground">
            {lang === "en"
              ? "Fallback data is shown while API is unavailable."
              : lang === "ru"
                ? "Показаны резервные данные, пока API недоступно."
                : "API жеткиликсиз учурда резервдик маалымат көрсөтүлдү."}
          </p>
        )}
      </motion.div>

      <div className="mt-8 inline-flex rounded-xl bg-secondary p-1">
        {genderOptions.map(([value, label]) => (
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

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading && products.length === 0
          ? Array.from({ length: 8 }).map((_, index) => (
              <div key={`products-skeleton-${index}`} className="h-[340px] animate-pulse rounded-2xl bg-secondary/60" />
            ))
          : filtered.map((p, i) => (
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
