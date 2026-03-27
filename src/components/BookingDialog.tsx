import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
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
import { api, ApiError, type ApiService } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

interface BookingDialogProps {
  master: Master;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const toTime = (value: string) => value.slice(0, 5);

const toDateParam = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const BookingDialog = ({ master, open, onOpenChange }: BookingDialogProps) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<ApiService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const { tr, tv, price, formatDate } = useI18n();
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const barberId = Number(master.id);
  const dateString = selectedDate ? toDateParam(selectedDate) : "";

  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: api.getServices,
  });

  const slotsQuery = useQuery({
    queryKey: ["slots", barberId, dateString],
    queryFn: () => api.getSlots(dateString, barberId),
    enabled: step === 3 && Boolean(dateString) && Number.isInteger(barberId),
  });

  const availableTimes = useMemo(() => {
    if (!slotsQuery.data) return [];
    return Array.from(new Set(slotsQuery.data.map((slot) => toTime(slot.time))));
  }, [slotsQuery.data]);

  const reset = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    if (!token) {
      toast({
        variant: "destructive",
        title: tr("booking.signin.required.title"),
        description: tr("booking.signin.required.desc"),
      });
      handleClose(false);
      const redirect = `${location.pathname}${location.search}`;
      navigate(`/auth?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    try {
      await api.createBooking(token, {
        serviceId: selectedService.id,
        barberId,
        date: dateString,
        time: selectedTime,
      });
      setStep(4);
      toast({
        title: tr("booking.successtoast"),
        description: `${master.name} - ${tv("service", selectedService.name)}, ${formatDate(selectedDate, {
          day: "numeric",
          month: "long",
        })}, ${selectedTime}`,
      });
    } catch (error) {
      const description =
        error instanceof ApiError ? error.message : tr("booking.error.create");
      toast({
        variant: "destructive",
        title: tr("booking.error.title"),
        description,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr("booking.title")}</DialogTitle>
          <DialogDescription>
            {master.name} - {tv("role", master.role)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          {[1, 2, 3].map((progressStep) => (
            <div
              key={progressStep}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                step >= progressStep ? "bg-primary" : "bg-muted",
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
              <p className="text-sm font-medium">{tr("booking.selectservice")}</p>
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {servicesQuery.isLoading && (
                  <p className="text-sm text-muted-foreground">{tr("booking.loading.services")}</p>
                )}
                {servicesQuery.isError && (
                  <p className="text-sm text-destructive">
                    {tr("booking.error.services")}
                  </p>
                )}
                {(servicesQuery.data || []).map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setStep(2);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all hover:border-primary/50",
                      selectedService?.id === service.id
                        ? "border-primary bg-primary/5"
                        : "border-border",
                    )}
                  >
                    <div>
                      <span className="text-sm font-medium">{tv("service", service.name)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {service.duration_minutes} {tr("common.min")}
                      </span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {price(Number(service.price))}
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
              <p className="text-sm font-medium">{tr("booking.selectdate")}</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate
                      ? formatDate(selectedDate, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                      : tr("booking.pickdate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                      if (date) setStep(3);
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
                {tr("booking.back")}
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
              <p className="text-sm font-medium">{tr("booking.selecttime")}</p>
              {slotsQuery.isLoading && (
                <p className="text-sm text-muted-foreground">{tr("booking.loading.slots")}</p>
              )}
              {slotsQuery.isError && (
                <p className="text-sm text-destructive">
                  {tr("booking.error.slots")}
                </p>
              )}
              {!slotsQuery.isLoading && !slotsQuery.isError && availableTimes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {tr("booking.noslots")}
                </p>
              )}
              <div className="grid grid-cols-4 gap-2">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-sm transition-all",
                      selectedTime === time
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {time}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  {tr("booking.back")}
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedTime || !selectedService}
                  onClick={handleConfirm}
                >
                  {tr("booking.confirm")}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && selectedService && selectedDate && selectedTime && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-6 text-center"
            >
              <CheckCircle2 className="h-12 w-12 text-accent" />
              <div>
                <p className="text-lg font-semibold">{tr("booking.success")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tv("service", selectedService.name)} - {master.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedDate, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}, {selectedTime}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {price(Number(selectedService.price))}
                </p>
              </div>
              <Button onClick={() => handleClose(false)} className="mt-2">
                {tr("booking.close")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
