import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-barber.jpg";
import MapModal from "@/components/MapModal";
import gallery1 from "@/assets/portfolio-1.jpg";
import gallery2 from "@/assets/portfolio-2.jpg";
import gallery3 from "@/assets/portfolio-3.jpg";
import gallery4 from "@/assets/portfolio-4.jpg";
import { useSalons } from "@/hooks/useSalons";
import { useI18n } from "@/lib/i18n";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.1, duration: 0.55, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

const branchLocations = [
  {
    titleKey: "home.branch.bishkek.title",
    descriptionKey: "home.branch.bishkek.desc",
  },
  {
    titleKey: "home.branch.tokmok.title",
    descriptionKey: "home.branch.tokmok.desc",
  },
  {
    titleKey: "home.branch.osh.title",
    descriptionKey: "home.branch.osh.desc",
  },
];

const galleryImages = [gallery1, gallery2, gallery3, gallery4];

const Index = () => {
  const { tr } = useI18n();
  const [isMapOpen, setIsMapOpen] = useState(false);
  const { salons, isLoading: salonsLoading, isError: salonsError, refetch: refetchSalons } = useSalons();

  const heroSalonsLabel = useMemo(
    () => tr("hero.locationCount", { count: salons.length }),
    [salons.length, tr],
  );

  return (
    <div>
      <section className="relative flex min-h-[72vh] items-center overflow-hidden sm:min-h-[85vh]">
        <div className="absolute inset-0">
          <img src={heroImage} alt={tr("hero.imageAlt")} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
        </div>

        <div className="page-shell relative z-10">
          <motion.div initial="hidden" animate="visible" className="max-w-3xl py-10 text-white">
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-200"
            >
              {tr("hero.tagline")}
            </motion.p>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl"
            >
              {tr("hero.title")}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl"
            >
              {tr("hero.desc")}
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="inline-flex flex-wrap items-center gap-3">
                <Link
                  to="/masters"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  {tr("hero.book")}
                </Link>
                <Link
                  to="/shop"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  {tr("hero.shop")}
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Открыть карту салонов"
                >
                  <MapPin className="h-5 w-5" />
                </button>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={4}
              className="mt-10 flex flex-wrap items-center gap-4 text-sm text-white/80"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                <MapPin className="h-4 w-4" /> {heroSalonsLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                <Clock className="h-4 w-4" /> {tr("hero.openHours")}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="page-shell page-section">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{tr("home.about.title")}</p>
            <h2 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">
              {tr("home.about.heading")}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {tr("home.about.subtitle")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="text-lg font-semibold">{tr("home.feature.modern.title")}</p>
              <p className="mt-3 text-sm text-muted-foreground">{tr("home.feature.modern.desc")}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="text-lg font-semibold">{tr("home.feature.professional.title")}</p>
              <p className="mt-3 text-sm text-muted-foreground">{tr("home.feature.professional.desc")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell page-section">
        <div className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{tr("home.gallery.heading")}</p>
          <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">{tr("home.gallery.title")}</h2>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {tr("home.gallery.subtitle")}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {galleryImages.map((image, index) => (
            <div key={index} className="overflow-hidden rounded-3xl bg-muted">
              <img
                src={image}
                alt={tr("home.gallery.alt")}
                className="h-64 w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell page-section">
        <div className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{tr("home.branches.heading")}</p>
          <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">{tr("home.branches.title")}</h2>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {tr("home.branches.subtitle")}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branchLocations.map((branch) => (
            <div key={branch.titleKey} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="text-xl font-semibold text-foreground">{tr(branch.titleKey)}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{tr(branch.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell page-section">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{tr("home.why.heading")}</p>
              <h2 className="text-3xl font-semibold text-foreground">{tr("home.why.title")}</h2>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-border bg-background/70 p-6">
                <p className="text-lg font-semibold">{tr("home.why.professional.title")}</p>
                <p className="mt-2 text-sm text-muted-foreground">{tr("home.why.professional.desc")}</p>
              </div>
              <div className="rounded-3xl border border-border bg-background/70 p-6">
                <p className="text-lg font-semibold">{tr("home.why.products.title")}</p>
                <p className="mt-2 text-sm text-muted-foreground">{tr("home.why.products.desc")}</p>
              </div>
              <div className="rounded-3xl border border-border bg-background/70 p-6">
                <p className="text-lg font-semibold">{tr("home.why.atmosphere.title")}</p>
                <p className="mt-2 text-sm text-muted-foreground">{tr("home.why.atmosphere.desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isMapOpen && <MapModal onClose={() => setIsMapOpen(false)} />}
    </div>
  );
};

export default Index;
