import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ArrowLeft, MapPin, Clock, Award } from "lucide-react";
import { masters } from "@/data/masters";
import BookingDialog from "@/components/BookingDialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const MasterDetail = () => {
  const { id } = useParams();
  const master = masters.find((m) => m.id === id);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  if (!master) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <p className="text-muted-foreground">Мастер табылган жок</p>
        <Link to="/masters" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          ← Мастерлерге кайтуу
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link
        to="/masters"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Бардык мастерлер
      </Link>

      {/* Hero section */}
      <div className="grid gap-10 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="overflow-hidden rounded-2xl">
            <img
              src={master.image}
              alt={master.name}
              className="h-full w-full aspect-[3/4] object-cover"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 flex flex-col justify-center"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-semibold">{master.name}</h1>
            {master.available && (
              <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent/20">
                Бош
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Award className="h-4 w-4" /> {master.role}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {master.experience}</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {master.location}</span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(master.rating) ? "fill-foreground text-foreground" : "text-muted"}`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{master.rating}</span>
            <span className="text-sm text-muted-foreground">({master.reviews} пикир)</span>
          </div>

          <p className="mt-6 text-muted-foreground leading-relaxed">{master.bio}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {master.specialties.map((s) => (
              <span
                key={s}
                className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
              >
                {s}
              </span>
            ))}
          </div>

          <button
            onClick={() => setBookingOpen(true)}
            disabled={!master.available}
            className="mt-8 inline-flex w-fit items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
          >
            {master.available ? "Жазылуу" : "Жазылуу жок"}
          </button>
        </motion.div>
      </div>

      {/* Portfolio */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-16"
      >
        <h2 className="text-2xl font-semibold">Портфолио</h2>
        <p className="mt-1 text-sm text-muted-foreground">Мастердин иштеринен үлгүлөр</p>
        <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-3">
          {master.portfolio.map((img, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer overflow-hidden rounded-2xl"
              onClick={() => setLightboxImg(img)}
            >
              <img
                src={img}
                alt={`${master.name} портфолио ${i + 1}`}
                className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Reviews */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-16 mb-8"
      >
        <h2 className="text-2xl font-semibold">Кардарлардын пикирлери</h2>
        <p className="mt-1 text-sm text-muted-foreground">{master.clientReviews.length} пикир</p>
        <div className="mt-6 space-y-4">
          {master.clientReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl bg-card p-5 card-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{review.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(review.date), "d MMMM yyyy", { locale: ru })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < review.rating ? "fill-foreground text-foreground" : "text-muted"}`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {review.text}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
          onClick={() => setLightboxImg(null)}
        >
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            src={lightboxImg}
            alt="Portfolio"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
          />
        </div>
      )}

      <BookingDialog master={master} open={bookingOpen} onOpenChange={setBookingOpen} />
    </div>
  );
};

export default MasterDetail;
