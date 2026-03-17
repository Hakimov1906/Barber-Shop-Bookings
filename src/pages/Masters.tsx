import { useState } from "react";
import { motion } from "framer-motion";
import { masters } from "@/data/masters";
import MasterCard from "@/components/MasterCard";

const filters = ["Баары", "Барбер", "Стилист", "Колорист"];
const locations = ["Баары", "Центр", "Север", "Юг"];

const Masters = () => {
  const [activeFilter, setActiveFilter] = useState("Баары");
  const [activeLocation, setActiveLocation] = useState("Баары");

  const filtered = masters.filter((m) => {
    const roleMatch = activeFilter === "Баары" || m.role === activeFilter;
    const locMatch = activeLocation === "Баары" || m.location === activeLocation;
    return roleMatch && locMatch;
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-semibold">Мастерлер</h1>
        <p className="mt-2 text-muted-foreground">Мастерди тандап, ыңгайлуу убакытка жазылыңыз</p>
      </motion.div>

      <div className="mt-8 flex flex-wrap gap-6">
        <div className="flex flex-wrap gap-2">
          <span className="mr-1 self-center text-xs text-muted-foreground uppercase tracking-wider">Адистик</span>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                activeFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="mr-1 self-center text-xs text-muted-foreground uppercase tracking-wider">Локация</span>
          {locations.map((l) => (
            <button
              key={l}
              onClick={() => setActiveLocation(l)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                activeLocation === l
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <MasterCard master={m} />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">Берилген фильтрлер боюнча мастерлер табылган жок</p>
        </div>
      )}
    </div>
  );
};

export default Masters;
