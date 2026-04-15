import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

const NotFound = () => {
  const navigate = useNavigate();
  const { tr } = useI18n();

  return (
    <div className="page-shell flex min-h-[80vh] items-center justify-center py-10">
      <div className="surface-card w-full max-w-xl p-8 text-center card-shadow sm:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{tr("notfound.error")}</p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">404</h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">{tr("notfound.desc")}</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            {tr("booking.back")}
          </button>
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tr("notfound.home")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
