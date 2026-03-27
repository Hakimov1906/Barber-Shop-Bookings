import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogOut, User, Mail, Phone, ListChecks, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { tr } = useI18n();

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-center justify-center px-6 py-12">
        <div className="w-full rounded-2xl bg-card p-8 text-center card-shadow">
          <h1 className="text-2xl font-semibold">{tr("profile.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr("profile.guest.desc")}
          </p>
          <Link
            to="/auth?redirect=%2Fprofile"
            className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {tr("auth.submit.login")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{tr("profile.title")}</h1>
            <p className="mt-1 text-muted-foreground">
              {tr("profile.subtitle")}
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <LogOut className="h-4 w-4" />
            {tr("nav.logout")}
          </button>
        </div>

        <div className="mt-8 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/profile/orders"
              className="rounded-2xl bg-card p-6 card-shadow transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <ListChecks className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{tr("profile.orders.title")}</p>
                  <p className="text-xs text-muted-foreground">
                    {tr("profile.orders.subtitle")}
                  </p>
                </div>
              </div>
            </Link>
            <Link
              to="/profile/settings"
              className="rounded-2xl bg-card p-6 card-shadow transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{tr("profile.settings.title")}</p>
                  <p className="text-xs text-muted-foreground">
                    {tr("profile.settings.subtitle")}
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="rounded-2xl bg-card p-6 card-shadow">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {tr("profile.field.fullName")}
                </p>
                <p className="text-sm font-medium">{user.fullName}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-6 card-shadow">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {tr("profile.field.email")}
                </p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-6 card-shadow">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {tr("profile.field.phone")}
                </p>
                <p className="text-sm font-medium">{user.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
