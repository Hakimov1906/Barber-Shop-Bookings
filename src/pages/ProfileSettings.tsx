import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Save } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { ApiError, api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PasswordInput } from "@/components/PasswordInput";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  detectPhoneCountry,
  getPhoneMaxLength,
  getPhonePattern,
  getPhonePrefix,
  normalizePhoneInput,
  type PhoneCountry,
} from "@/lib/phone";

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 20;
const PASSWORD_PATTERN = /^[A-Za-z0-9]+$/;

const ProfileSettings = () => {
  const { user, token, syncUser } = useAuth();
  const { tr } = useI18n();
  const [fullName, setFullName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [phone, setPhone] = useState(getPhonePrefix(DEFAULT_PHONE_COUNTRY));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  useEffect(() => {
    if (!user) return;
    const detectedCountry = detectPhoneCountry(user.phone);
    setFullName(user.fullName);
    setPhoneCountry(detectedCountry);
    setPhone(normalizePhoneInput(user.phone, detectedCountry));
  }, [user]);

  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      fullName.trim() !== user.fullName ||
      normalizePhoneInput(phone, phoneCountry) !== user.phone
    );
  }, [user, fullName, phone, phoneCountry]);

  const currentPasswordValue = currentPassword.trim();
  const passwordTooShort = newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH;
  const passwordTooLong = newPassword.length > MAX_PASSWORD_LENGTH;
  const passwordInvalidCharacters =
    newPassword.length > 0 && !PASSWORD_PATTERN.test(newPassword);
  const passwordSameAsCurrent =
    currentPasswordValue.length > 0 && newPassword.length > 0 && currentPasswordValue === newPassword;
  const passwordMismatch = repeatPassword.length > 0 && newPassword !== repeatPassword;
  const canSubmitPassword = Boolean(
    currentPasswordValue &&
      newPassword.length >= MIN_PASSWORD_LENGTH &&
      newPassword.length <= MAX_PASSWORD_LENGTH &&
      PASSWORD_PATTERN.test(newPassword) &&
      currentPasswordValue !== newPassword &&
      repeatPassword &&
      newPassword === repeatPassword,
  );

  const handlePhoneChange = (value: string) => {
    setPhone(normalizePhoneInput(value, phoneCountry));
  };

  const handlePhoneCountryChange = (value: string) => {
    const nextCountry = value as PhoneCountry;
    setPhoneCountry(nextCountry);
    setPhone(getPhonePrefix(nextCountry));
  };

  const handlePhoneKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const selectionStart = event.currentTarget.selectionStart ?? 0;
    const selectionEnd = event.currentTarget.selectionEnd ?? 0;
    const prefix = getPhonePrefix(phoneCountry);
    const affectsPrefix =
      (event.key === "Backspace" && selectionStart <= prefix.length) ||
      (event.key === "Delete" && selectionStart < prefix.length);

    if (affectsPrefix && selectionStart === selectionEnd) {
      event.preventDefault();
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!token || !user) {
        throw new ApiError("Sign in required", 401);
      }

      const payload: { fullName?: string; phone?: string } = {};
      const fullNameValue = fullName.trim();
      const phoneValue = normalizePhoneInput(phone, phoneCountry);

      if (fullNameValue !== user.fullName) {
        payload.fullName = fullNameValue;
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

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new ApiError("Sign in required", 401);
      }
      if (passwordTooLong || passwordInvalidCharacters || passwordSameAsCurrent) {
        throw new ApiError("Invalid payload", 400);
      }

      return api.updatePassword(token, {
        currentPassword: currentPasswordValue,
        newPassword,
      });
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      toast({
        title: tr("profile.settings.password.success.title"),
        description: tr("profile.settings.password.success.desc"),
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: tr("profile.settings.password.error.title"),
        description:
          error instanceof ApiError
            ? error.message
            : tr("profile.settings.password.error.desc"),
      });
    },
  });

  if (!user || !token) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{tr("profile.settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          {tr("profile.settings.subtitle")}
        </p>
      </div>

      <div className="space-y-5">
        <form
          className="surface-card space-y-4 p-5 card-shadow sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (hasChanges) {
              saveMutation.mutate();
            }
          }}
        >
          <div>
            <label
              htmlFor="profile-fullname"
              className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground"
            >
              {tr("profile.field.fullName")}
            </label>
            <input
              id="profile-fullname"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="h-10 sm:h-11 w-full min-w-0 box-border rounded-lg border-0 bg-secondary px-4 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground"
              minLength={2}
              maxLength={120}
              required
            />
          </div>

          <div>
            <label
              htmlFor="profile-phone"
              className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground"
            >
              {tr("profile.field.phone")}
            </label>
            <div className="flex gap-2">
                <select
                  aria-label="Phone country"
                  value={phoneCountry}
                  onChange={(event) => handlePhoneCountryChange(event.target.value)}
                  className="h-10 sm:h-11 w-36 box-border rounded-lg border-0 bg-secondary px-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground"
                >
                {PHONE_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
               <input
                 id="profile-phone"
                 value={phone}
                 onChange={(event) => handlePhoneChange(event.target.value)}
                 onKeyDown={handlePhoneKeyDown}
                 onFocus={() => setPhone((current) => normalizePhoneInput(current, phoneCountry))}
                 type="tel"
                 inputMode="numeric"
                 maxLength={getPhoneMaxLength(phoneCountry)}
                 pattern={getPhonePattern(phoneCountry)}
                 className="h-10 sm:h-11 min-w-0 flex-1 box-border rounded-lg border-0 bg-secondary px-4 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground"
                 required
               />
            </div>
          </div>

          <button
            type="submit"
            disabled={!hasChanges || saveMutation.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? tr("auth.submit.wait") : tr("profile.settings.save.action")}
          </button>
        </form>

        <form
          className="surface-card space-y-4 p-5 card-shadow sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmitPassword) {
              passwordMutation.mutate();
            }
          }}
        >
          <div>
            <h2 className="text-lg font-semibold">{tr("profile.settings.password.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tr("profile.settings.password.subtitle")}
            </p>
          </div>

          <div>
            <label
              htmlFor="profile-password-current"
              className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground"
            >
              {tr("profile.settings.password.current")}
            </label>
            <PasswordInput
              id="profile-password-current"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="h-10 sm:h-11 w-full min-w-0 box-border rounded-lg border-0 bg-secondary px-4 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground"
              autoComplete="current-password"
              required
            />
          </div>

          <div>
            <label
              htmlFor="profile-password-new"
              className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground"
            >
              {tr("profile.settings.password.new")}
            </label>
            <PasswordInput
              id="profile-password-new"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="h-10 sm:h-11 w-full min-w-0 box-border rounded-lg border-0 bg-secondary px-4 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground"
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              pattern="[A-Za-z0-9]+"
              autoComplete="new-password"
              required
            />
            {passwordTooShort && (
              <p className="mt-1 text-xs text-destructive">
                {tr("profile.settings.password.error.minLength")}
              </p>
            )}
            {passwordTooLong && (
              <p className="mt-1 text-xs text-destructive">
                {tr("profile.settings.password.error.maxLength")}
              </p>
            )}
            {passwordInvalidCharacters && (
              <p className="mt-1 text-xs text-destructive">
                {tr("profile.settings.password.error.characters")}
              </p>
            )}
            {passwordSameAsCurrent && (
              <p className="mt-1 text-xs text-destructive">
                {tr("profile.settings.password.error.sameAsCurrent")}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="profile-password-repeat"
              className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground"
            >
              {tr("profile.settings.password.repeat")}
            </label>
            <PasswordInput
              id="profile-password-repeat"
              value={repeatPassword}
              onChange={(event) => setRepeatPassword(event.target.value)}
              className="h-10 sm:h-11 w-full min-w-0 box-border rounded-lg border-0 bg-secondary px-4 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground"
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              pattern="[A-Za-z0-9]+"
              autoComplete="new-password"
              required
            />
            {passwordMismatch && (
              <p className="mt-1 text-xs text-destructive">
                {tr("profile.settings.password.error.mismatch")}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmitPassword || passwordMutation.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4" />
            {passwordMutation.isPending
              ? tr("auth.submit.wait")
              : tr("profile.settings.password.action")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
