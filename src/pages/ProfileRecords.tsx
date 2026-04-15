import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";

const ProfileRecords = () => {
  const { token } = useAuth();
  const { tr, formatDate } = useI18n();

  const recordsQuery = useQuery({
    queryKey: ["my-reviews", token],
    queryFn: () => api.getMyReviews(token as string),
    enabled: Boolean(token),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{tr("profile.records.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          {tr("profile.records.subtitle")}
        </p>
      </div>

      {recordsQuery.isLoading && (
        <div className="surface-card p-5">
          <p className="text-sm text-muted-foreground">{tr("profile.orders.loading")}</p>
        </div>
      )}

      {recordsQuery.isError && (
        <div className="surface-card p-5">
          <p className="text-sm text-destructive">{tr("profile.records.error")}</p>
          <button
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
            onClick={() => recordsQuery.refetch()}
          >
            {tr("common.retry")}
          </button>
        </div>
      )}

      {!recordsQuery.isLoading && !recordsQuery.isError && recordsQuery.data?.length === 0 && (
        <div className="surface-card p-6 card-shadow">
          <p className="text-sm text-muted-foreground">{tr("profile.records.empty")}</p>
        </div>
      )}

      <div className="space-y-4">
        {recordsQuery.data?.map((record) => (
          <div key={record.id} className="surface-card p-5 card-shadow sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {tr("profile.records.barber")}
                </p>
                <p className="mt-1 text-base font-semibold">#{record.barber_id}</p>
              </div>

              <div className="sm:text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {tr("profile.records.date")}
                </p>
                <p className="mt-1 text-sm">
                  {formatDate(new Date(record.created_at), {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">
                {tr("profile.records.rating")} {record.rating}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">{record.comment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileRecords;
