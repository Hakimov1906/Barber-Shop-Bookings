import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Master } from "@/data/masters";
import BookingDialog from "@/components/BookingDialog";

const MasterCard = ({ master }: { master: Master }) => {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="group relative overflow-hidden rounded-2xl bg-card card-shadow transition-shadow duration-200 hover:card-shadow-hover"
      >
        <Link to={`/masters/${master.id}`} className="block">
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={master.image}
              alt={master.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </Link>
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link to={`/masters/${master.id}`} className="hover:underline">
                <h3 className="text-lg font-semibold tracking-tight">{master.name}</h3>
              </Link>
              <p className="text-sm text-muted-foreground">
                {master.role} • {master.experience}
              </p>
            </div>
            {master.available && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent/20">
                Бош
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
            <span className="tabular font-medium text-foreground">{master.rating}</span>
            <span>• {master.reviews} пикир</span>
          </div>
          <button
            onClick={() => setBookingOpen(true)}
            disabled={!master.available}
            className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
          >
            {master.available ? "Жазылуу" : "Жазылуу жок"}
          </button>
        </div>
      </motion.div>
      <BookingDialog master={master} open={bookingOpen} onOpenChange={setBookingOpen} />
    </>
  );
};

export default MasterCard;
