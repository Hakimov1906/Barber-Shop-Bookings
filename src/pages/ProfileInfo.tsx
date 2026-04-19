import { User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

const ProfileInfo = () => {
  const { user } = useAuth();
  const { tr } = useI18n();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-2xl font-semibold sm:text-3xl text-foreground">
          Добро пожаловать в ваш профиль.
        </p>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Здесь вы можете просматривать и обновлять свою основную личную информацию.
        </p>
      </div>

      <div className="surface-card p-5 card-shadow">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {tr("profile.field.fullName")}
            </p>
            <p className="text-sm font-medium">{user.fullName}</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {tr("profile.field.phone")}
            </p>
            <p className="text-sm font-medium">{user.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;
