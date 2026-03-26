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
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <p className="text-muted-foreground">{tr("master.loading")}</p>
      </div>
    );
  }

  if (!master) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <p className="text-muted-foreground">{tr("masters.notfound.single")}</p>
        <Link
          to="/masters"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          {tr("masters.backlink")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link
        to="/masters"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> {tr("masters.back")}
      </Link>

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
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                {tr("master.available")}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Award className="h-4 w-4" /> {tv("role", master.role)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatYears(master.experience)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {tv("location", master.location)}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
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
            <p className="mt-6 text-muted-foreground leading-relaxed">{master.bio}</p>
          )}

          {master.specialties.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {master.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                >
                  {tv("specialty", specialty)}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => setBookingOpen(true)}
            disabled={!master.available}
            className="mt-8 inline-flex w-fit items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
          >
            {master.available ? tr("master.book") : tr("master.nobook")}
          </button>
        </motion.div>
      </div>

      {master.portfolio.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-semibold">{tr("master.portfolio")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr("master.portfolio.desc")}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            {master.portfolio.map((image, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer overflow-hidden rounded-2xl"
                onClick={() => setLightboxImg(image)}
              >
                <img
                  src={image}
                  alt={`${master.name} portfolio ${index + 1}`}
                  className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-16 mb-8"
      >
        <h2 className="text-2xl font-semibold">{tr("master.clientreviews")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {clientReviews.length} {tr("master.reviews")}
        </p>

        <div className="mt-6 space-y-4">
          {reviewsQuery.isLoading && (
            <p className="text-sm text-muted-foreground">{tr("master.reviews.loading")}</p>
          )}

          {!reviewsQuery.isLoading && clientReviews.length === 0 && (
            <p className="text-sm text-muted-foreground">{tr("master.reviews.empty")}</p>
          )}

          {clientReviews.map((review) => (
            <div key={review.id} className="rounded-2xl bg-card p-5 card-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {review.author.charAt(0)}
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
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {review.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-card p-5 card-shadow">
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
                  className="rounded p-1 transition-transform hover:scale-110"
                  aria-label={`${value} star`}
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
            className="mt-4 min-h-[110px] w-full rounded-lg border-0 bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground transition-shadow"
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
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
          >
            {reviewMutation.isPending ? tr("auth.submit.wait") : tr("master.review.form.submit")}
          </button>
        </div>
      </motion.section>

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
