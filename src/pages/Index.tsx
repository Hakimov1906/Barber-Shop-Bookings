import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-barber.jpg";
import MasterCard from "@/components/MasterCard";
import ProductCard from "@/components/ProductCard";
import SalonsMap from "@/components/SalonsMap";
import { useMasters } from "@/hooks/useMasters";
import { useProducts } from "@/hooks/useProducts";
import { useSalons } from "@/hooks/useSalons";
import { useI18n, type Lang } from "@/lib/i18n";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

function formatSalonsCount(lang: Lang, count: number) {
  if (lang === "en") {
    return `${count} ${count === 1 ? "location" : "locations"}`;
  }

  if (lang === "ru") {
    const abs = Math.abs(count);
    const mod10 = abs % 10;
    const mod100 = abs % 100;

    if (mod10 === 1 && mod100 !== 11) return `${count} филиал`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      return `${count} филиала`;
    }
    return `${count} филиалов`;
  }

  return `${count} филиал`;
}

function fallbackText(lang: Lang) {
  if (lang === "en") return "Fallback data is shown while API is unavailable.";
  if (lang === "ru") return "Показаны резервные данные, пока API недоступно.";
  return "API жеткиликсиз учурда резервдик маалымат көрсөтүлдү.";
}

function sectionTitleSalons(lang: Lang) {
  if (lang === "en") return "Salons";
  if (lang === "ru") return "Салоны";
  return "Салондор";
}

const Index = () => {
  const { tr, lang } = useI18n();
  const { masters, isLoading: mastersLoading, isFallback: mastersFallback } = useMasters();
  const { products, isLoading: productsLoading, isFallback: productsFallback } = useProducts();
  const { salons, isLoading: salonsLoading, isFallback: salonsFallback } = useSalons();

  const heroSalonsLabel = useMemo(
    () => formatSalonsCount(lang, salons.length),
    [lang, salons.length],
  );

  return (
    <div>
      <section className="relative flex min-h-[85vh] items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="HairLine salon" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
          <motion.div initial="hidden" animate="visible" className="max-w-xl">
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-sm font-medium tracking-widest uppercase text-muted-foreground"
            >
              {tr("hero.subtitle")}
            </motion.p>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mt-4 text-hero font-semibold text-foreground"
            >
              {tr("hero.title")}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-4 text-lg leading-relaxed text-muted-foreground"
            >
              {tr("hero.desc")}
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/masters"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
              >
                {tr("hero.book")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/80"
              >
                {tr("hero.shop")}
              </Link>
            </motion.div>
            <motion.div
              variants={fadeUp}
              custom={4}
              className="mt-8 flex gap-6 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {heroSalonsLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {tr("hero.hours")}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{tr("masters.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{tr("masters.subtitle")}</p>
            {mastersFallback && (
              <p className="mt-2 text-xs text-muted-foreground">{fallbackText(lang)}</p>
            )}
          </div>
          <Link
            to="/masters"
            className="hidden items-center gap-1 text-sm font-medium text-foreground hover:underline sm:flex"
          >
            {tr("masters.all")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {mastersLoading && masters.length === 0
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={`master-skeleton-${index}`} className="h-[360px] animate-pulse rounded-2xl bg-secondary/60" />
              ))
            : masters.map((master, index) => (
                <motion.div
                  key={master.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <MasterCard master={master} />
                </motion.div>
              ))}
        </div>
      </section>

      <section className="bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{tr("products.title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{tr("products.subtitle")}</p>
              {productsFallback && (
                <p className="mt-2 text-xs text-muted-foreground">{fallbackText(lang)}</p>
              )}
            </div>
            <Link
              to="/shop"
              className="hidden items-center gap-1 text-sm font-medium text-foreground hover:underline sm:flex"
            >
              {tr("products.all")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {productsLoading && products.length === 0
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={`product-skeleton-${index}`} className="h-[340px] animate-pulse rounded-2xl bg-card/70" />
                ))
              : products.slice(0, 4).map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-2xl font-semibold">{sectionTitleSalons(lang)}</h2>
        {salonsFallback && <p className="mt-2 text-xs text-muted-foreground">{fallbackText(lang)}</p>}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {salonsLoading && salons.length === 0
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={`salon-skeleton-${index}`} className="h-[148px] animate-pulse rounded-2xl bg-secondary/60" />
              ))
            : salons.map((salon) => (
                <div key={salon.id} className="rounded-2xl bg-card p-6 card-shadow">
                  <h3 className="font-semibold">{salon.name}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {salon.address}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {salon.workHours}
                  </p>
                </div>
              ))}
        </div>
        <div className="mt-8">
          <SalonsMap locations={salons} />
        </div>
      </section>
    </div>
  );
};

export default Index;
