import { Link, useLocation } from "react-router-dom";
import { Home, Users, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";

const TabBar = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const { isAuthenticated } = useAuth();
  const { tr } = useI18n();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const initialViewportHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const keyboardThreshold = initialViewportHeight * 0.5;
      setIsVisible(currentHeight > initialViewportHeight - keyboardThreshold);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tabs = [
    {
      to: "/",
      label: tr("nav.home"),
      icon: Home,
      active: location.pathname === "/",
    },
    {
      to: "/masters",
      label: tr("nav.masters"),
      icon: Users,
      active: location.pathname.startsWith("/masters"),
    },
    {
      to: "/shop",
      label: tr("nav.shop"),
      icon: ShoppingBag,
      active: location.pathname.startsWith("/shop"),
    },
    {
      to: "/cart",
      label: tr("nav.cart"),
      icon: ShoppingCart,
      active: location.pathname.startsWith("/cart"),
      badge: totalItems > 0 ? totalItems : undefined,
    },
    ...(isAuthenticated
      ? [
          {
            to: "/profile",
            label: tr("nav.profile"),
            icon: User,
            active: location.pathname.startsWith("/profile"),
          },
        ]
      : [
          {
            to: "/auth",
            label: tr("nav.login"),
            icon: User,
            active: location.pathname === "/auth",
          },
        ]),
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm md:hidden transition-transform duration-300",
      !isVisible && "translate-y-full"
    )}>
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.active;

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[0.65rem] font-semibold text-destructive-foreground">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="font-medium leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;
