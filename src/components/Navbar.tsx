import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, User, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const location = useLocation();
  const { tr, lang } = useI18n();
  const { isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const previousTotal = useRef(totalItems);
  const langRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { to: "/", label: tr("nav.home") },
    { to: "/masters", label: tr("nav.masters") },
    { to: "/shop", label: tr("nav.shop") },
  ];

  const isActiveLink = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let timeout: number | undefined;

    if (totalItems > previousTotal.current) {
      setBadgePulse(true);
      timeout = window.setTimeout(() => setBadgePulse(false), 250);
    }

    previousTotal.current = totalItems;
    return () => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [totalItems]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const langLabels: Record<string, string> = { ky: "KY", ru: "RU", en: "EN" };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "border-b border-border/80 bg-background/90 backdrop-blur-md nav-shadow"
          : "bg-background/75 backdrop-blur-sm"
      }`}
    >
      <nav className="page-shell flex h-14 items-center justify-between sm:h-16">
        <div>
          <Link to="/" className="text-[1.7rem] font-semibold tracking-tighter text-foreground leading-none">
            HairLine
          </Link>
        </div>

        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm transition-colors duration-150 ${
                isActiveLink(link.to)
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Language switcher - visible on all screens */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:text-foreground hover:border-border md:flex"
              aria-label={tr("lang.switch")}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{langLabels[lang]}</span>
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[100px] overflow-hidden rounded-lg border border-border bg-card card-shadow animate-in fade-in-0 zoom-in-95">
                {(["ky", "ru", "en"] as const).map((language) => (
                  <button
                    key={language}
                    onClick={() => {
                      setLang(language);
                      setLangOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
                      lang === language
                        ? "bg-primary/5 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <span>{langLabels[language]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: cart + profile */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/cart"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <span className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[0.65rem] font-semibold text-destructive-foreground">
                    {totalItems}
                  </span>
                )}
              </span>
            </Link>
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95"
              >
                <User className="h-4 w-4" />
                {tr("nav.profile")}
              </Link>
            ) : (
              <Link
                to="/auth"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95"
              >
                <User className="h-4 w-4" />
                {tr("nav.login")}
              </Link>
            )}
          </div>

          {/* Mobile: cart only */}
          <Link
            to="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[0.65rem] font-semibold text-destructive-foreground">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
