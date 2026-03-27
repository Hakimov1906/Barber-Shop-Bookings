import { useState } from "react";
import { motion } from "framer-motion";
import MasterCard from "@/components/MasterCard";
import { useI18n } from "@/lib/i18n";
import { useMasters } from "@/hooks/useMasters";

function normalizeRole(value: string) {
  const source = value.trim().toLowerCase();
  if (source.includes("barber")) return "barber";
  if (source.includes("stylist")) return "stylist";
  if (source.includes("color")) return "colorist";
  return source;
}

function normalizeLocation(value: string) {
  const source = value.trim().toLowerCase();
  if (source.includes("center") || source.includes("chuy") || source.includes("toktogul")) {
    return "center";
  }
  if (source.includes("north") || source.includes("kiev") || source.includes("jibek")) {
    return "north";
  }
  if (
    source.includes("south") ||
    source.includes("manasa") ||
    source.includes("isanova") ||
    source.includes("akhunbaev") ||
    source.includes("abdrakhmanov")
  ) {
    return "south";
  }
  return source;
}

const Masters = () => {
  const { tr, lang } = useI18n();
  const { masters, isLoading, isFallback } = useMasters();

  const filters = [
    { key: "all", label: tr("filter.all"), value: "all" },
    { key: "barber", label: tr("filter.barber"), value: "barber" },
    { key: "stylist", label: tr("filter.stylist"), value: "stylist" },
    { key: "colorist", label: tr("filter.colorist"), value: "colorist" },
  ];

  const locations = [
    { key: "all", label: tr("filter.all"), value: "all" },
    { key: "center", label: tr("filter.center"), value: "center" },
    { key: "north", label: tr("filter.north"), value: "north" },
    { key: "south", label: tr("filter.south"), value: "south" },
  ];

  const [activeFilter, setActiveFilter] = useState("all");
  const [activeLocation, setActiveLocation] = useState("all");

  const filtered = masters.filter((master) => {
    const roleMatch =
      activeFilter === "all" || normalizeRole(master.role) === activeFilter;
    const locationMatch =
      activeLocation === "all" || normalizeLocation(master.location) === activeLocation;
    return roleMatch && locationMatch;
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-semibold">{tr("masters.page.title")}</h1>
        <p className="mt-2 text-muted-foreground">{tr("masters.page.subtitle")}</p>
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

      <div className="mt-8 flex flex-wrap gap-6">
        <div className="flex flex-wrap gap-2">
          <span className="mr-1 self-center text-xs text-muted-foreground uppercase tracking-wider">
            {tr("masters.specialty")}
          </span>
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                activeFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="mr-1 self-center text-xs text-muted-foreground uppercase tracking-wider">
            {tr("masters.location")}
          </span>
          {locations.map((location) => (
            <button
              key={location.key}
              onClick={() => setActiveLocation(location.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                activeLocation === location.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              {location.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading && masters.length === 0
          ? Array.from({ length: 8 }).map((_, index) => (
              <div key={`masters-skeleton-${index}`} className="h-[360px] animate-pulse rounded-2xl bg-secondary/60" />
            ))
          : filtered.map((master, index) => (
              <motion.div
                key={master.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <MasterCard master={master} />
              </motion.div>
            ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">{tr("masters.notfound")}</p>
        </div>
      )}
    </div>
  );
};

export default Masters;
