"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerDashboard } from "@/components/customer-dashboard";
import { AdminDashboard } from "@/components/admin-dashboard";
import { BarberDashboard } from "@/components/barber-dashboard";
import { Toaster } from "sonner";
import { useAuth } from "@/context/auth-context";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, isLoading } = useAuth();
  const tabParam = searchParams.get('tab') as 'appointments' | 'profile' | null;

  useEffect(() => {
    // Wait for auth hydration before deciding to redirect.
    // If user is not logged in, send them back to login.
    // Note: isLoading includes both initial hydration and localStorage restoration,
    // so we wait for that to complete before redirecting unauthenticated users.
    if (!isLoading && !isLoggedIn) {
      // Add a small delay to handle state update race conditions
      const timeoutId = setTimeout(() => {
        router.push("/login?returnTo=/dashboard");
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, isLoggedIn, router]);

  // Show nothing while hydrating (avoids flash)
  if (isLoading || !user) return null;

  // Toaster lives here for dashboard-level toasts
  const content = (() => {
    if (user.role === "admin")  return <AdminDashboard  user={user} />;
    if (user.role === "barber") return <BarberDashboard user={user} />;
    return <CustomerDashboard user={user} initialTab={tabParam} />;
  })();

  return (
    <>
      <Toaster position="top-center" expand={true} richColors />
      {content}
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
