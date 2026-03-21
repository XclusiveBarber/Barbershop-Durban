"use client";

/**
 * Complete Profile Page
 *
 * Shown after OAuth sign-in (e.g. Google) when the user doesn't have a name yet.
 * Collects the user's name, saves it to the profiles table, and logs them in.
 */

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, ChevronRight, AlertCircle } from "lucide-react";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getProfile, createProfile, updateProfile } from "@/lib/supabase-auth";
import { useAuth, type AuthUser } from "@/context/auth-context";

export default function CompleteProfilePage() {
  return (
    <Suspense>
      <CompleteProfileContent />
    </Suspense>
  );
}

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";
  const { login } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveName = async () => {
    if (!firstName.trim()) {
      setError("Please enter your first name");
      return;
    }
    if (!lastName.trim()) {
      setError("Please enter your last name");
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setError("Session expired — please sign in again");
        setLoading(false);
        return;
      }

      const authUser = session.user;
      const token = session.access_token;

      const profile = await getProfile(authUser.id);

      if (profile) {
        await updateProfile(authUser.id, { name: fullName, email: authUser.email ?? "" });
      } else {
        await createProfile({
          id: authUser.id,
          email: authUser.email ?? "",
          name: fullName,
          role: "customer",
        });
      }

      const userData: AuthUser = {
        id: authUser.id,
        email: authUser.email ?? "",
        name: fullName,
        role: (profile?.role as AuthUser["role"]) ?? "customer",
      };

      login(userData, token);
      toast.success(`Welcome, ${firstName.trim()}!`);
      router.push(returnTo);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save name";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster position="top-center" expand richColors />

      {/* Header */}
      <nav className="bg-black py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Xclusive Barber" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-white font-montserrat">
              XCLUSIVE BARBER
            </span>
          </Link>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-light text-black mb-3">Complete Your Profile</h3>
            <p className="text-sm text-black/50 max-w-sm mx-auto leading-relaxed">
              Enter your name and surname so we know who to expect.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-black/40 font-medium">First Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
              <input
                type="text"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setError(null); }}
                placeholder="e.g. Thabo"
                className="w-full pl-12 pr-4 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-black/40 font-medium">Last Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
              <input
                type="text"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setError(null); }}
                placeholder="e.g. Dlamini"
                className="w-full pl-12 pr-4 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                onKeyDown={(e) => e.key === "Enter" && !loading && handleSaveName()}
                disabled={loading}
              />
            </div>
          </div>

          <button
            onClick={handleSaveName}
            disabled={!firstName.trim() || !lastName.trim() || loading}
            className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Saving..." : "Continue"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
