import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, ShoppingCart, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import MapModal from "@/components/MapModal";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const location = useLocation();
  const { tr } = useI18n();
  const { isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const previousTotal = useRef(totalItems);

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

  useEffect(() => setMobileOpen(false), [location]);

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

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Link
            to="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <motion.span
              animate={badgePulse ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.25 }}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[0.65rem] font-semibold text-destructive-foreground">
                  {totalItems}
                </span>
              )}
            </motion.span>
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

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <Link
            to="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[0.65rem] font-semibold text-destructive-foreground">
                {totalItems}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 text-foreground transition-colors hover:bg-secondary"
            aria-label={mobileOpen ? tr("nav.closeMenu") : tr("nav.openMenu")}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {isMapOpen && <MapModal onClose={() => setIsMapOpen(false)} />}

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-b border-border bg-background/95 backdrop-blur-md md:hidden"
          >
            <div className="page-shell pb-4 pt-2">
              <div className="space-y-1 rounded-2xl border border-border bg-card p-2 shadow-sm">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActiveLink(link.to)
                        ? "bg-secondary font-medium text-foreground"
                        : "text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <Link
                    to="/profile"
                    className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    <User className="h-4 w-4" />
                    {tr("nav.profile")}
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    <User className="h-4 w-4" />
                    {tr("nav.login")}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
