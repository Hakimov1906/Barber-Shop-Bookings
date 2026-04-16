import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, User, ListChecks, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { tr } = useI18n();

  if (!isAuthenticated || !user) {
    return (
      <div className="page-shell page-section">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card p-8 text-center card-shadow sm:p-10">
          <h1 className="section-title">{tr("profile.guest.title")}</h1>
          <p className="section-subtitle">{tr("profile.guest.desc")}</p>
          <Link
            to="/auth?redirect=%2Fprofile"
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tr("auth.submit.login")}
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      to: "/profile",
      label: tr("profile.tab.info"),
      icon: User,
      end: true,
    },
    {
      to: "/profile/orders",
      label: tr("profile.tab.orders"),
      icon: ListChecks,
    },
    {
      to: "/profile/settings",
      label: tr("profile.tab.settings"),
      icon: Settings,
    },
  ];

  return (
    <div className="page-shell page-section">
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="surface-card h-fit p-4 shadow-sm xl:sticky xl:top-20">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            <button
              onClick={logout}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-destructive px-4 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/90"
            >
              <LogOut className="h-4 w-4" />
              {tr("nav.logout")}
            </button>
          </div>
        </aside>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Profile;
