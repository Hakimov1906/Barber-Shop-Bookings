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
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="surface-card p-5 card-shadow">
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

      <div className="surface-card p-5 card-shadow">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {tr("profile.field.phone")}
        </p>
        <p className="mt-1 text-sm font-medium">{user.phone}</p>
      </div>
    </div>
  );
};

export default ProfileInfo;
