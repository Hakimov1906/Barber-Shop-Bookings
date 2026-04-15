import { useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { useI18n } from "@/lib/i18n";
import { useProducts } from "@/hooks/useProducts";

type Gender = "all" | "men" | "women";

const Shop = () => {
  const [gender, setGender] = useState<Gender>("all");
  const { tr } = useI18n();
  const { products, isLoading, isError, refetch } = useProducts();

  const genderOptions: [Gender, string][] = [
    ["all", tr("shop.all")],
    ["men", tr("shop.men")],
    ["women", tr("shop.women")],
  ];

  const filtered = products.filter((product) => {
    if (gender === "all") return true;
    return product.category === gender || product.category === "unisex";
  });

  return (
    <div className="page-shell page-section">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="section-title">{tr("shop.title")}</h1>
        <p className="section-subtitle">{tr("shop.subtitle")}</p>
      </motion.div>

      <div className="mt-6 surface-card p-3 sm:p-4">
        <div className="chip-row">
          {genderOptions.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setGender(value)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                gender === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/75"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading &&
          products.length === 0 &&
          Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`products-skeleton-${index}`}
              className="h-[340px] animate-pulse rounded-2xl bg-secondary/60"
            />
          ))}

        {!isLoading && isError && (
          <div className="surface-card col-span-full p-6 text-center">
            <p className="text-sm text-muted-foreground">{tr("shop.error.load")}</p>
            <button
              className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => refetch()}
            >
              {tr("common.retry")}
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="surface-card col-span-full p-6 text-center">
            <p className="text-sm text-muted-foreground">{tr("shop.empty")}</p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          filtered.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
      </div>
    </div>
  );
};

export default Shop;
