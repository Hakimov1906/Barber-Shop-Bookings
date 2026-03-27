import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { ApiError, api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const ProfileSettings = () => {
  const { user, token, isAuthenticated, syncUser } = useAuth();
  const { tr } = useI18n();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setEmail(user.email);
    setPhone(user.phone);
  }, [user]);

  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      fullName.trim() !== user.fullName ||
      email.trim().toLowerCase() !== user.email.toLowerCase() ||
      phone.trim() !== user.phone
    );
  }, [user, fullName, email, phone]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!token || !user) {
        throw new ApiError("Sign in required", 401);
      }

      const payload: { fullName?: string; email?: string; phone?: string } = {};
      const fullNameValue = fullName.trim();
      const emailValue = email.trim().toLowerCase();
      const phoneValue = phone.trim();

      if (fullNameValue !== user.fullName) {
        payload.fullName = fullNameValue;
      }
      if (emailValue !== user.email.toLowerCase()) {
        payload.email = emailValue;
      }
      if (phoneValue !== user.phone) {
        payload.phone = phoneValue;
      }

      return api.updateProfile(token, payload);
    },
    onSuccess: (response) => {
      syncUser({
        id: response.user.id,
        fullName: response.user.full_name,
        email: response.user.email,
        phone: response.user.phone,
      });
      toast({
        title: tr("profile.settings.save.success.title"),
        description: tr("profile.settings.save.success.desc"),
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: tr("profile.settings.save.error.title"),
        description:
          error instanceof ApiError
            ? error.message
            : tr("profile.settings.save.error.desc"),
      });
    },
  });

  if (!isAuthenticated || !user || !token) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-center justify-center px-6 py-12">
        <div className="w-full rounded-2xl bg-card p-8 text-center card-shadow">
          <h1 className="text-2xl font-semibold">{tr("profile.settings.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{tr("profile.guest.desc")}</p>
          <Link
            to="/auth?redirect=%2Fprofile%2Fsettings"
            className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {tr("auth.submit.login")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{tr("profile.settings.title")}</h1>
          <p className="mt-1 text-muted-foreground">{tr("profile.settings.subtitle")}</p>
        </div>
        <Link
          to="/profile"
          className="inline-flex rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
        >
          {tr("profile.back")}
        </Link>
      </div>

      <form
        className="mt-8 space-y-4 rounded-2xl bg-card p-6 card-shadow"
        onSubmit={(event) => {
          event.preventDefault();
          if (hasChanges) {
            saveMutation.mutate();
          }
        }}
      >
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
            {tr("profile.field.fullName")}
          </label>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-lg border-0 bg-secondary px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground"
            minLength={2}
            maxLength={120}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
            {tr("profile.field.email")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border-0 bg-secondary px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
            {tr("profile.field.phone")}
          </label>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-lg border-0 bg-secondary px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!hasChanges || saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? tr("auth.submit.wait") : tr("profile.settings.save.action")}
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;

