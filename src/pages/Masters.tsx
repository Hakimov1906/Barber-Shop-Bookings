import { useMemo, useState } from "react";
import { motion } from "framer-motion";
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

  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSalon, setActiveSalon] = useState("all");

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
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading && masters.length === 0 &&
          Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`masters-skeleton-${index}`}
              className="h-[360px] animate-pulse rounded-2xl bg-secondary/60"
            />
          ))}

        {!isLoading && isError && (
          <div className="surface-card col-span-full p-6 text-center">
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
          <div className="surface-card col-span-full p-6 text-center">
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
            >
              <MasterCard master={master} />
            </motion.div>
          ))}
      </div>
    </div>
  );
};

export default Masters;
