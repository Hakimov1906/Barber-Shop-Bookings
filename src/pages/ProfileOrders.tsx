import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock3, MapPin, Scissors, UserRound, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { ApiError, api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

function parseDate(value: string) {
  if (!value) return null;
  const dateOnly = value.slice(0, 10);
  const parsed = new Date(`${dateOnly}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getOrderStatus(dateValue: string) {
  const bookingDate = parseDate(dateValue);
  if (!bookingDate) {
    return "pending";
  }
  return bookingDate < Date.now() ? "completed" : "pending";
}

const sampleOrders = [
  {
    id: 3021,
    date: "2026-04-10",
    time: "14:00",
    total: "$45.00",
    status: "completed",
    service: "Classic haircut",
  },
  {
    id: 3022,
    date: "2026-04-18",
    time: "11:30",
    total: "$60.00",
    status: "pending",
    service: "Beard trim",
  },
];

const ProfileOrders = () => {
  const { token } = useAuth();
  const { tr, formatDate } = useI18n();
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ["my-bookings", token],
    queryFn: () => api.getMyBookings(token as string),
    enabled: Boolean(token),
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: number) => api.cancelBooking(token as string, bookingId),
    onSuccess: () => {
      toast({
        title: tr("profile.orders.cancel.success.title"),
        description: tr("profile.orders.cancel.success.desc"),
      });
      queryClient.invalidateQueries({ queryKey: ["my-bookings", token] });
      queryClient.invalidateQueries({ queryKey: ["barber-reviews"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: tr("profile.orders.cancel.error.title"),
        description:
          error instanceof ApiError ? error.message : tr("profile.orders.cancel.error.desc"),
      });
    },
  });

  const orders = bookingsQuery.isError
    ? sampleOrders
    : bookingsQuery.data?.map((booking) => ({
        id: booking.id,
        date: booking.date,
        time: booking.time.slice(0, 5),
        total: `$${Number(booking.service_price).toFixed(2)}`,
        status: getOrderStatus(booking.date),
        service: booking.service_name,
      })) ?? [];

  const showEmpty = !bookingsQuery.isLoading && !bookingsQuery.isError && orders.length === 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{tr("profile.orders.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          {tr("profile.orders.subtitle")}
        </p>
      </div>

      {bookingsQuery.isError && (
        <div className="surface-card p-5">
          <p className="text-sm text-destructive">{tr("profile.orders.error")}</p>
          <button
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
            onClick={() => bookingsQuery.refetch()}
          >
            {tr("common.retry")}
          </button>
        </div>
      )}

      {bookingsQuery.isLoading && (
        <div className="surface-card p-5">
          <p className="text-sm text-muted-foreground">{tr("profile.orders.loading")}</p>
        </div>
      )}

      {showEmpty && (
        <div className="surface-card p-6 card-shadow">
          <p className="text-sm text-muted-foreground">{tr("profile.orders.empty")}</p>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const orderDate = parseDate(order.date);
          const isCancellingCurrent =
            cancelMutation.isPending && cancelMutation.variables === order.id;

          return (
            <div key={order.id} className="surface-card p-5 card-shadow sm:p-6">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="rounded-full bg-secondary/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]">
                      {tr("profile.orders.order", { id: order.id })}
                    </span>
                    <span>{order.service}</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{tr("profile.orders.details.date")}</p>
                      <p className="text-sm text-foreground">
                        {orderDate
                          ? formatDate(orderDate, {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : order.date}{" "}
                        {order.time}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{tr("profile.orders.details.total")}</p>
                      <p className="text-sm text-foreground">{order.total}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{tr("profile.orders.details.status")}</p>
                      <p className={`text-sm font-medium ${
                        order.status === "completed"
                          ? "text-foreground"
                          : "text-primary"
                      }`}>
                        {tr(`profile.orders.status.${order.status}`)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => cancelMutation.mutate(order.id)}
                  disabled={cancelMutation.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  {isCancellingCurrent ? tr("auth.submit.wait") : tr("profile.orders.cancel.action")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileOrders;
