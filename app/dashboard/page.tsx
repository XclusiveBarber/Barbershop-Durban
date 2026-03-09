"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CustomerDashboard } from "@/components/customer-dashboard";
import { AdminDashboard } from "@/components/admin-dashboard";
import { BarberDashboard } from "@/components/barber-dashboard";
import { Toaster } from "sonner";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    // Wait for auth hydration before deciding to redirect
    if (!isLoading && !isLoggedIn) {
      router.push("/login?returnTo=/dashboard");
    }
  }, [isLoading, isLoggedIn, router]);

  // Show nothing while hydrating (avoids flash)
  if (isLoading || !user) return null;

  // Toaster lives here for dashboard-level toasts
  const content = (() => {
    if (user.role === "admin")  return <AdminDashboard  user={user} />;
    if (user.role === "barber") return <BarberDashboard user={user} />;
    return <CustomerDashboard user={user} />;
  })();

  return (
    <>
      <Toaster position="top-center" expand={true} richColors />
      {content}
    </>
  );
}
