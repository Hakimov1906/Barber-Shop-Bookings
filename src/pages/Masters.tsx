import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MasterCard from "@/components/MasterCard";
import { useI18n } from "@/lib/i18n";
import { useMasters } from "@/hooks/useMasters";
import { useSalons } from "@/hooks/useSalons";

function normalizeRole(value: string) {
  const source = value.trim().toLowerCase();
  if (source.includes("barber")) return "barber";
  if (source.includes("stylist")) return "stylist";
  if (source.includes("color")) return "colorist";
  return source;
}

const Masters = () => {
  const { tr } = useI18n();
  const { masters, isLoading, isError, refetch } = useMasters();
  const { salons } = useSalons();
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSalon, setActiveSalon] = useState("all");
  const mastersScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollMasters = (direction: "left" | "right") => {
    if (!mastersScrollRef.current) return;
    mastersScrollRef.current.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  const filters = [
    { key: "all", label: tr("filter.all"), value: "all" },
    { key: "barber", label: tr("filter.barber"), value: "barber" },
    { key: "stylist", label: tr("filter.stylist"), value: "stylist" },
    { key: "colorist", label: tr("filter.colorist"), value: "colorist" },
  ];

  const salonFilters = useMemo(
    () => [
      { key: "all", label: tr("filter.all"), value: "all" },
      ...salons.map((salon) => ({
        key: salon.id,
        label: salon.name,
        value: salon.id,
      })),
    ],
    [salons, tr],
  );

  const filtered = masters.filter((master) => {
    const roleMatch =
      activeFilter === "all" || normalizeRole(master.role) === activeFilter;
    const salonMatch = activeSalon === "all" || master.salonId === activeSalon;
    return roleMatch && salonMatch;
  });

  return (
    <div className="page-shell page-section">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="section-title">{tr("masters.page.title")}</h1>
        <p className="section-subtitle">{tr("masters.page.subtitle")}</p>
      </motion.div>

      <div className="mt-6 space-y-3">
        <div className="surface-card p-3 sm:p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {tr("masters.specialty")}
          </p>
          <div className="chip-row">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.value)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  activeFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/75"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="surface-card p-3 sm:p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {tr("masters.location")}
          </p>
          <div className="chip-row">
            {salonFilters.map((salonFilter) => (
              <button
                key={salonFilter.key}
                onClick={() => setActiveSalon(salonFilter.value)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  activeSalon === salonFilter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/75"
                }`}
              >
                {salonFilter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 relative">
          <div className="absolute right-0 top-0 flex gap-2 md:hidden">
            <button
              type="button"
              onClick={() => scrollMasters("left")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition hover:bg-background"
              aria-label="Scroll masters left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollMasters("right")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition hover:bg-background"
              aria-label="Scroll masters right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={mastersScrollRef}
            className="flex flex-row flex-nowrap gap-6 overflow-x-auto scroll-smooth pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-visible md:pb-0"
          >
            {isLoading && masters.length === 0 &&
              Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`masters-skeleton-${index}`}
                  className="min-w-[260px] flex-shrink-0 h-[360px] animate-pulse rounded-2xl bg-secondary/60"
                />
              ))}

            {!isLoading && isError && (
              <div className="surface-card min-w-full p-6 text-center">
                <p className="text-sm text-muted-foreground">{tr("masters.error.load")}</p>
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
                <p className="text-sm text-muted-foreground">{tr("masters.notfound")}</p>
              </div>
            )}

            {!isLoading &&
              !isError &&
              filtered.map((master, index) => (
                <motion.div
                  key={master.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.25 }}
                  className="min-w-[260px] flex-shrink-0 md:min-w-0 md:w-auto"
                >
                  <MasterCard master={master} />
                </motion.div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Masters;
