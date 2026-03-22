"use client";

/**
 * Reset Password Page
 *
 * User lands here after clicking the reset link in their email.
 * Supabase handles the recovery token in the URL fragment and fires
 * a PASSWORD_RECOVERY auth event — we wait for that before showing the form.
 * If no recovery event arrives (expired/invalid link), we show an error state.
 */

import React, { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ChevronRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AuthChangeEvent } from "@supabase/supabase-js";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

type PageState = "loading" | "ready" | "expired";

function ResetPasswordContent() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Supabase fires PASSWORD_RECOVERY when it detects a valid recovery token
    // in the URL fragment. If the token is expired/invalid it fires SIGNED_OUT.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === "PASSWORD_RECOVERY") {
        setPageState("ready");
      } else if (event === "SIGNED_OUT") {
        setPageState("expired");
      }
    });

    // Fallback: if the user already has a session (e.g., tab refresh), allow them through.
    // Also handles the case where the event fired before we subscribed.
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) setPageState((s) => s === "loading" ? "ready" : s);
    })();

    // Safety net: if neither event fires within 4 seconds, treat the link as expired.
    const timeout = setTimeout(() => {
      setPageState((s) => s === "loading" ? "expired" : s);
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        throw new Error(updateError.message || "Failed to reset password");
      }

      toast.success("Password reset successfully!");
      router.push("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const Nav = () => (
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
  );

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-black/40">Verifying reset link…</p>
        </div>
      </div>
    );
  }

  if (pageState === "expired") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Toaster position="top-center" expand richColors />
        <Nav />
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-3">
              <h3 className="text-3xl font-light text-black">Link Expired</h3>
              <p className="text-sm text-black/50 leading-relaxed">
                This password reset link has expired or already been used. Reset links are valid for 1 hour.
              </p>
            </div>
            <Link
              href="/auth/request-reset"
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 font-medium text-sm uppercase tracking-wide hover:opacity-90 transition-all"
            >
              Request a new link <ChevronRight className="w-4 h-4" />
            </Link>
            <div className="pt-2">
              <Link href="/login" className="text-xs text-black/50 hover:text-black transition-colors underline underline-offset-2">
                ← Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster position="top-center" expand richColors />
      <Nav />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-light text-black mb-3">Reset Your Password</h3>
            <p className="text-sm text-black/50 max-w-sm mx-auto leading-relaxed">
              Enter a new password to regain access to your account.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-black/40 font-medium">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-black/40 font-medium">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                onKeyDown={(e) => e.key === "Enter" && !loading && handleResetPassword()}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleResetPassword}
            disabled={!password || !confirm || loading}
            className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Resetting..." : "Reset Password"} <ChevronRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-4">
            <p className="text-xs text-black/50">
              Remember your password?{" "}
              <Link href="/login" className="text-black hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
