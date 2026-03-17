import { motion } from "framer-motion";
import { ArrowRight, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-barber.jpg";
import { masters } from "@/data/masters";
import { products } from "@/data/products";
import MasterCard from "@/components/MasterCard";
import ProductCard from "@/components/ProductCard";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  }),
};

const Index = () => (
  <div>
    {/* Hero */}
    <section className="relative flex min-h-[85vh] items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="HairLine salon" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          className="max-w-xl"
        >
          <motion.p variants={fadeUp} custom={0} className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
            Сеть премиум-салонов
          </motion.p>
          <motion.h1 variants={fadeUp} custom={1} className="mt-4 text-hero font-semibold text-foreground">
            Точность в каждой линии
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Опытные мастера, премиальная продукция и безупречный сервис в каждом из наших салонов.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/masters"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
            >
              Записаться
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/80"
            >
              Магазин
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} custom={4} className="mt-8 flex gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> 3 локации</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> 9:00 — 21:00</span>
          </motion.div>
        </motion.div>
      </div>
    </section>

    {/* Masters */}
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Наши мастера</h2>
          <p className="mt-1 text-sm text-muted-foreground">Профессионалы с подтверждённым опытом</p>
        </div>
        <Link to="/masters" className="hidden items-center gap-1 text-sm font-medium text-foreground hover:underline sm:flex">
          Все мастера <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {masters.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <MasterCard master={m} />
          </motion.div>
        ))}
      </div>
    </section>

    {/* Products */}
    <section className="bg-secondary/40">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Продукция</h2>
            <p className="mt-1 text-sm text-muted-foreground">Профессиональный уход для ваших волос</p>
          </div>
          <Link to="/shop" className="hidden items-center gap-1 text-sm font-medium text-foreground hover:underline sm:flex">
            Весь каталог <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Locations */}
    <section className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="text-2xl font-semibold">Наши салоны</h2>
      <p className="mt-1 text-sm text-muted-foreground">Удобное расположение в каждом районе</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {[
          { name: "HairLine Центр", address: "ул. Центральная, 15", hours: "9:00 — 21:00" },
          { name: "HairLine Север", address: "пр. Северный, 42", hours: "10:00 — 20:00" },
          { name: "HairLine Юг", address: "ул. Южная, 8", hours: "9:00 — 21:00" },
        ].map((loc) => (
          <div key={loc.name} className="rounded-2xl bg-card p-6 card-shadow">
            <h3 className="font-semibold">{loc.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {loc.address}
            </p>
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {loc.hours}
            </p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

export default Index;
