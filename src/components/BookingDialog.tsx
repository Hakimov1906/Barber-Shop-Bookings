import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Master } from "@/data/masters";
import { services, type Service } from "@/data/services";
import { toast } from "@/hooks/use-toast";

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00",
];

interface BookingDialogProps {
  master: Master;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BookingDialog = ({ master, open, onOpenChange }: BookingDialogProps) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const relevantServices = services.filter((s) => {
    const specialties = master.specialties.map((sp) => sp.toLowerCase());
    return specialties.some(
      (sp) =>
        s.name.toLowerCase().includes(sp.split(" ")[0]) ||
        sp.includes(s.name.toLowerCase().split(" ")[0])
    );
  });

  const availableServices = relevantServices.length > 0 ? relevantServices : services;

  const reset = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleConfirm = () => {
    setStep(4);
    toast({
      title: "Жазылуу ийгиликтүү!",
      description: `${master.name} — ${selectedService?.name}, ${format(selectedDate!, "d MMMM", { locale: ru })}, ${selectedTime}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Мастерге жазылуу</DialogTitle>
          <DialogDescription>
            {master.name} • {master.role}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                step >= s ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <p className="text-sm font-medium">Кызматты тандаңыз</p>
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {availableServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedService(s);
                      setStep(2);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all hover:border-primary/50",
                      selectedService?.id === s.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <div>
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {s.duration}
                      </span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {s.price} сом
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <p className="text-sm font-medium">Күндү тандаңыз</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate
                      ? format(selectedDate, "d MMMM yyyy", { locale: ru })
                      : "Күндү тандаңыз"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      setSelectedDate(d);
                      if (d) setStep(3);
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today || date.getDay() === 0;
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                ← Артка
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <p className="text-sm font-medium">Убакытты тандаңыз</p>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={cn(
                      "flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-sm transition-all",
                      selectedTime === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  ← Артка
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedTime}
                  onClick={handleConfirm}
                >
                  Ырастоо
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-6 text-center"
            >
              <CheckCircle2 className="h-12 w-12 text-accent" />
              <div>
                <p className="text-lg font-semibold">Сиз жазылдыңыз!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedService?.name} — {master.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: ru })},{" "}
                  {selectedTime}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {selectedService?.price} сом
                </p>
              </div>
              <Button onClick={() => handleClose(false)} className="mt-2">
                Жабуу
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
