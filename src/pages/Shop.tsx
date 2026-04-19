import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";
import { useI18n } from "@/lib/i18n";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/data/products";

type Gender = "all" | "men" | "women";

const Shop = () => {
  const [gender, setGender] = useState<Gender>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { tr } = useI18n();
  const { products, isLoading, isError, refetch } = useProducts();

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const productsScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollProducts = (direction: "left" | "right") => {
    if (!productsScrollRef.current) return;
    productsScrollRef.current.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

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

      <div className="mt-8 relative">
        <div className="absolute right-0 top-0 flex gap-2 md:hidden">
          <button
            type="button"
            onClick={() => scrollProducts("left")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition hover:bg-background"
            aria-label="Scroll products left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollProducts("right")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition hover:bg-background"
            aria-label="Scroll products right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={productsScrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-visible md:pb-0"
        >
          {isLoading &&
            products.length === 0 &&
            Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`products-skeleton-${index}`}
                className="min-w-[260px] flex-shrink-0 h-[340px] animate-pulse rounded-2xl bg-secondary/60"
              />
            ))}

          {!isLoading && isError && (
            <div className="surface-card min-w-full p-6 text-center">
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
            <div className="surface-card min-w-full p-6 text-center">
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
                className="min-w-[260px] flex-shrink-0 md:min-w-0 md:w-auto"
              >
                <ProductCard product={product} onProductClick={handleOpenModal} />
              </motion.div>
            ))}
        </div>
      </div>

      {isModalOpen && selectedProduct && (
        <ProductModal product={selectedProduct} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Shop;
