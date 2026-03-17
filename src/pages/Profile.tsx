import { motion } from "framer-motion";
import { Calendar, ShoppingBag, Settings, LogOut, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const tabs = [
  { id: "appointments", label: "Записи", icon: Calendar },
  { id: "orders", label: "Заказы", icon: ShoppingBag },
  { id: "settings", label: "Настройки", icon: Settings },
];

const Profile = () => {
  const [activeTab, setActiveTab] = useState("appointments");

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Профиль</h1>
            <p className="mt-1 text-muted-foreground">Управляйте записями и заказами</p>
          </div>
          <Link
            to="/auth"
            className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/70"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </Link>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 rounded-xl bg-secondary p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                activeTab === id
                  ? "bg-card text-foreground card-shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-8">
          {activeTab === "appointments" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-card p-6 card-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      Ближайшая
                    </span>
                    <h3 className="mt-2 text-lg font-semibold">Мужская стрижка</h3>
                    <p className="text-sm text-muted-foreground">Алексей Ривера • Барбер</p>
                  </div>
                  <button className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/70 transition-colors">
                    Перенести
                  </button>
                </div>
                <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> 20 марта, 14:30</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 45 мин</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Центр</span>
                </div>
              </div>

              <div className="rounded-2xl bg-card p-6 card-shadow opacity-60">
                <h3 className="text-lg font-semibold">Окрашивание балаяж</h3>
                <p className="text-sm text-muted-foreground">Елена Морозова • Колорист</p>
                <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> 5 марта, 11:00</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 120 мин</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Юг</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="rounded-2xl bg-card p-8 text-center card-shadow">
              <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">У вас пока нет заказов</p>
              <Link
                to="/shop"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
              >
                Перейти в магазин
              </Link>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-md space-y-4">
              {["Имя", "Email", "Телефон"].map((label) => (
                <div key={label}>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</label>
                  <input
                    className="mt-1 w-full rounded-lg border-0 bg-secondary py-3 px-4 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground transition-shadow"
                    placeholder={label}
                  />
                </div>
              ))}
              <button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]">
                Сохранить
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
