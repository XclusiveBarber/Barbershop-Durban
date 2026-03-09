"use client";

/**
 * Auth Callback Page — Handles email magic link verification
 *
 * Flow:
 * 1. User clicks link in email → redirected here with token
 * 2. Supabase automatically verifies the token
 * 3. Check if profile exists:
 *    - If yes: log in and redirect to dashboard
 *    - If no: redirect to /login with step=name to ask for name
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth, type AuthUser } from "@/context/auth-context";
import { getProfile, createProfile, getCurrentUser } from "@/lib/supabase-auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get current authenticated user
        // (Supabase automatically validates the token from the URL)
        const user = await getCurrentUser();

        if (!user) {
          setError("Authentication failed. Please try again.");
          toast.error("Authentication failed");
          setTimeout(() => router.push("/login"), 2000);
          return;
        }

        // Check if profile exists
        const profile = await getProfile(user.id);

        if (profile) {
          // Existing user — log in and redirect to dashboard
          const userData: AuthUser = {
            id: user.id,
            email: user.email || "",
            name: profile.full_name || user.email?.split("@")[0] || "User",
            role: profile.role || "customer",
          };
          login(userData);
          toast.success(`Welcome back, ${userData.name}!`);
          router.push("/dashboard");
        } else {
          // New user — redirect to login with name step
          // Store the user ID temporarily in URL params
          router.push(`/login?step=name&userId=${user.id}&email=${user.email}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Authentication error";
        setError(message);
        toast.error(message);
        setTimeout(() => router.push("/login"), 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
        <h1 className="text-2xl font-light text-black mb-2">Signing you in...</h1>
        <p className="text-black/50 text-sm">Please wait while we verify your email.</p>
        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
}
