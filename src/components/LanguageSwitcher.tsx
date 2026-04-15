import { useI18n, type Lang } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const labels: Record<Lang, string> = { ky: "KY", ru: "RU", en: "EN" };

const LanguageSwitcher = () => {
  const { lang, setLang, tr } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:text-foreground hover:border-border"
        aria-label={tr("lang.switch")}
      >
        <Globe className="h-3.5 w-3.5" />
        {labels[lang]}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[100px] overflow-hidden rounded-lg border border-border bg-card card-shadow animate-in fade-in-0 zoom-in-95">
          {(["ky", "ru", "en"] as Lang[]).map((language) => (
            <button
              key={language}
              onClick={() => {
                setLang(language);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
                lang === language
                  ? "bg-primary/5 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span>{labels[language]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
