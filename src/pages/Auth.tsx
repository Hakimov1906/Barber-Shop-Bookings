import { useMemo, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Lock, User, Phone, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { PasswordInput } from "@/components/PasswordInput";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  getPhoneMaxLength,
  getPhonePattern,
  getPhonePlaceholder,
  getPhonePrefix,
  normalizePhoneInput,
  type PhoneCountry,
} from "@/lib/phone";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [phone, setPhone] = useState(getPhonePrefix(DEFAULT_PHONE_COUNTRY));
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();
  const { tr } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return query.get("redirect") || "/profile";
  }, [location.search]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const phoneValue = normalizePhoneInput(phone, phoneCountry);
    try {
      if (isLogin) {
        await login(phoneValue, password);
      } else {
        await register({
          fullName: fullName.trim(),
          phone: phoneValue,
          password,
        });
      }
      toast({
        title: isLogin ? tr("auth.toast.login.title") : tr("auth.toast.register.title"),
        description: tr("auth.toast.success.desc"),
      });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const description =
        error instanceof ApiError ? error.message : tr("auth.toast.error.desc");
      toast({
        variant: "destructive",
        title: tr("auth.toast.error.title"),
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="page-shell page-section">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card card-shadow"
      >
        <div className="grid min-h-[600px] md:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden bg-secondary/70 p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--foreground)/0.05),transparent_55%)]" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                HairLine
              </p>
              <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
                {isLogin ? tr("auth.login.title") : tr("auth.register.title")}
              </h1>
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                {isLogin ? tr("auth.login.subtitle") : tr("auth.register.subtitle")}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                <div className="surface-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {tr("booking.title")}
                  </p>
                  <p className="mt-1 text-sm font-medium">{tr("hero.hours")}</p>
                </div>
                <div className="surface-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {tr("hero.locations")}
                  </p>
                  <p className="mt-1 text-sm font-medium">{tr("salons.subtitle")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <form className="space-y-4" onSubmit={handleSubmit}>
               {!isLogin && (
                 <div className="relative">
                   <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                   <input
                     value={fullName}
                     onChange={(event) => setFullName(event.target.value)}
                     required
                     type="text"
                     placeholder={tr("auth.field.fullName")}
                     className="h-10 sm:h-11 w-full min-w-0 box-border rounded-lg border-0 bg-secondary py-3 pl-10 pr-4 text-sm text-foreground outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground"
                   />
                 </div>
               )}

              <div className="flex gap-2">
                <select
                  aria-label="Phone country"
                  value={phoneCountry}
                  onChange={(event) => handlePhoneCountryChange(event.target.value)}
                  style={{ minWidth: 70, maxWidth: 100, flexShrink: 0 }}
                  className="h-10 sm:h-11 w-20 sm:w-24 box-border rounded-lg border-0 bg-secondary px-3 text-sm text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-2 focus:ring-foreground"
                >
                  {PHONE_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    value={phone}
                    onChange={(event) => handlePhoneChange(event.target.value)}
                    onKeyDown={handlePhoneKeyDown}
                    onFocus={() => setPhone((current) => normalizePhoneInput(current, phoneCountry))}
                    required
                    type="tel"
                    inputMode="numeric"
                    maxLength={getPhoneMaxLength(phoneCountry)}
                    pattern={getPhonePattern(phoneCountry)}
                    placeholder={getPhonePlaceholder(phoneCountry)}
                    className="h-10 sm:h-11 w-full min-w-0 box-border rounded-lg border-0 bg-secondary pl-10 pr-4 text-sm text-foreground outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground"
                  />
                </div>
              </div>

              <div className="relative">
                <PasswordInput
                  icon={<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  maxLength={isLogin ? undefined : 20}
                  pattern={isLogin ? undefined : "[A-Za-z0-9]+"}
                  placeholder={tr("auth.field.password")}
                  className="h-10 sm:h-11 w-full min-w-0 box-border rounded-lg border-0 bg-secondary py-3 pl-10 text-sm text-foreground outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground"
                />
              </div>

              <button
                disabled={isSubmitting}
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? tr("auth.submit.wait")
                  : isLogin
                    ? tr("auth.submit.login")
                    : tr("auth.submit.register")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? tr("auth.toggle.noAccount") : tr("auth.toggle.haveAccount")}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
              >
                {isLogin ? tr("auth.toggle.create") : tr("auth.toggle.login")}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
