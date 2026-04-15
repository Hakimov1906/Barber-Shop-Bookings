import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ArrowLeft, MapPin, Clock, Award } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import BookingDialog from "@/components/BookingDialog";
import { useI18n } from "@/lib/i18n";
import { useMasters } from "@/hooks/useMasters";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { ApiError, api } from "@/lib/api";
import { mapApiReviewsToMasterReviews } from "@/lib/masters";

const MIN_REVIEW_LENGTH = 5;

const MasterDetail = () => {
  const { id } = useParams();
  const { masters, isLoading } = useMasters();
  const master = masters.find((item) => item.id === id);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const { tr, tv, formatDate, formatYears } = useI18n();
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const barberId = Number(id);

  const reviewsQuery = useQuery({
    queryKey: ["barber-reviews", barberId],
    queryFn: () => api.getBarberReviews(barberId),
    enabled: Number.isInteger(barberId) && barberId > 0,
    retry: 1,
  });

  const clientReviews = useMemo(() => {
    if (reviewsQuery.data) {
      return mapApiReviewsToMasterReviews(reviewsQuery.data);
    }
    return master?.clientReviews || [];
  }, [reviewsQuery.data, master?.clientReviews]);

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new ApiError("Sign in required", 401);
      }

      return api.createBarberReview(token, barberId, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
    },
    onSuccess: () => {
      toast({
        title: tr("master.review.success.title"),
        description: tr("master.review.success.desc"),
      });
      setReviewRating(5);
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ["barber-reviews", barberId] });
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
    },
    onError: (error) => {
      const description =
        error instanceof ApiError ? error.message : tr("master.review.error.desc");
      toast({
        variant: "destructive",
        title: tr("master.review.error.title"),
        description,
      });
    },
  });

  const canSubmitReview =
    Boolean(token) &&
    reviewComment.trim().length >= MIN_REVIEW_LENGTH &&
    !reviewMutation.isPending;

  if (isLoading) {
    return (
      <div className="page-shell page-section">
        <div className="surface-card p-10 text-center">
          <p className="text-muted-foreground">{tr("master.loading")}</p>
        </div>
      </div>
    );
  }

  if (!master) {
    return (
      <div className="page-shell page-section">
        <div className="surface-card p-10 text-center">
          <p className="text-muted-foreground">{tr("masters.notfound.single")}</p>
          <Link
            to="/masters"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            {tr("masters.backlink")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell page-section">
      <Link
        to="/masters"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {tr("masters.back")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card overflow-hidden"
        >
          <img
            src={master.image}
            alt={master.name}
            className="h-full w-full object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="surface-card p-5 sm:p-7"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold sm:text-3xl">{master.name}</h1>
            {master.available && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                {tr("master.available")}
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <span className="flex items-center gap-1.5">
              <Award className="h-4 w-4" /> {tv("role", master.role)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {formatYears(master.experience)}
            </span>
            <span className="flex items-start gap-1.5 sm:col-span-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {master.salonName || tr("masters.unassignedSalon")}
                {master.salonAddress ? ` - ${master.salonAddress}` : ""}
              </span>
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${
                    index < Math.round(master.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-amber-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{master.rating}</span>
            <span className="text-sm text-muted-foreground">
              ({master.reviews} {tr("master.reviews")})
            </span>
          </div>

          {master.bio && (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {master.bio}
            </p>
          )}

          {master.specialties.length > 0 && (
            <div className="mt-5 chip-row">
              {master.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="whitespace-nowrap rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                >
                  {tv("specialty", specialty)}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => setBookingOpen(true)}
            disabled={!master.available}
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
          >
            {master.available ? tr("master.book") : tr("master.nobook")}
          </button>
        </motion.div>
      </div>

      {master.portfolio.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mt-10"
        >
          <h2 className="section-title">{tr("master.portfolio")}</h2>
          <p className="section-subtitle">{tr("master.portfolio.desc")}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {master.portfolio.map((image, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                type="button"
                className="surface-card cursor-pointer overflow-hidden text-left"
                onClick={() => setLightboxImg(image)}
              >
                <img
                  src={image}
                  alt={tr("master.portfolio.imageAlt", {
                    name: master.name,
                    index: index + 1,
                  })}
                  className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-10"
      >
        <h2 className="section-title">{tr("master.clientreviews")}</h2>
        <p className="section-subtitle">
          {clientReviews.length} {tr("master.reviews")}
        </p>

        <div className="mt-6 space-y-4">
          {reviewsQuery.isLoading && (
            <div className="surface-card p-5">
              <p className="text-sm text-muted-foreground">{tr("master.reviews.loading")}</p>
            </div>
          )}

          {!reviewsQuery.isLoading && reviewsQuery.isError && (
            <div className="surface-card p-5">
              <p className="text-sm text-destructive">{tr("master.review.error.desc")}</p>
            </div>
          )}

          {!reviewsQuery.isLoading && !reviewsQuery.isError && clientReviews.length === 0 && (
            <div className="surface-card p-5">
              <p className="text-sm text-muted-foreground">{tr("master.reviews.empty")}</p>
            </div>
          )}

          {clientReviews.map((review) => (
            <div key={review.id} className="surface-card p-5 card-shadow">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {review.author.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{review.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(review.date), {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-3.5 w-3.5 ${
                        index < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-amber-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.text}</p>
            </div>
          ))}
        </div>

        <div className="surface-card mt-6 p-5 card-shadow sm:p-6">
          <h3 className="text-lg font-semibold">{tr("master.review.form.title")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{tr("master.review.form.desc")}</p>

          {!isAuthenticated && (
            <p className="mt-4 text-sm text-muted-foreground">
              {tr("master.review.signin.required")}{" "}
              <Link
                to={`/auth?redirect=${encodeURIComponent(`/masters/${master.id}`)}`}
                className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
              >
                {tr("auth.submit.login")}
              </Link>
            </p>
          )}

          <div className="mt-4 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewRating(value)}
                  className="rounded p-1 transition-transform hover:scale-110 disabled:pointer-events-none"
                  aria-label={tr("master.review.starLabel", { count: value })}
                  disabled={!isAuthenticated}
                >
                  <Star
                    className={`h-5 w-5 ${
                      value <= reviewRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-amber-200"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <textarea
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder={tr("master.review.form.placeholder")}
            className="mt-4 min-h-[110px] w-full rounded-lg border-0 bg-secondary px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground"
            disabled={!isAuthenticated || reviewMutation.isPending}
            maxLength={1000}
          />

          <div className="mt-2 text-xs text-muted-foreground">
            {reviewComment.trim().length}/{1000}
          </div>

          <button
            type="button"
            onClick={() => reviewMutation.mutate()}
            disabled={!canSubmitReview}
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
          >
            {reviewMutation.isPending ? tr("auth.submit.wait") : tr("master.review.form.submit")}
          </button>
        </div>
      </motion.section>

      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}
        >
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            src={lightboxImg}
            alt={tr("master.portfolio.lightboxAlt", { name: master.name })}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
          />
        </div>
      )}

      <BookingDialog master={master} open={bookingOpen} onOpenChange={setBookingOpen} />
    </div>
  );
};

export default MasterDetail;
