import { Suspense, lazy, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import Layout from "@/components/Layout";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const Index = lazy(() => import("./pages/Index"));
const Masters = lazy(() => import("./pages/Masters"));
const MasterDetail = lazy(() => import("./pages/MasterDetail"));
const Shop = lazy(() => import("./pages/Shop"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfileInfo = lazy(() => import("./pages/ProfileInfo"));
const ProfileOrders = lazy(() => import("./pages/ProfileOrders"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const ProfileRecords = lazy(() => import("./pages/ProfileRecords"));

const queryClient = new QueryClient();

const RouteLoader = () => (
  <div className="mx-auto max-w-7xl px-6 py-16 text-sm text-muted-foreground">Loading...</div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/masters" element={<Masters />} />
                    <Route path="/masters/:id" element={<MasterDetail />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile" element={<Profile />}>
                      <Route index element={
                        <ProtectedRoute>
                          <ProfileInfo />
                        </ProtectedRoute>
                      } />
                      <Route path="orders" element={
                        <ProtectedRoute>
                          <ProfileOrders />
                        </ProtectedRoute>
                      } />
                      <Route path="records" element={
  <ProtectedRoute>
    <ProfileRecords />
  </ProtectedRoute>
} />
                      <Route path="settings" element={
                        <ProtectedRoute>
                          <ProfileSettings />
                        </ProtectedRoute>
                      } />
                    </Route>
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
