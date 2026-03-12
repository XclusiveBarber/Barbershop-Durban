"use client";

/**
 * Request Password Reset Page
 *
 * User enters their email to request a password reset.
 * Supabase sends them a reset link via email.
 */

import React, { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ChevronRight, AlertCircle, ChevronLeft } from "lucide-react";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function RequestResetPage() {
  return (
    <Suspense>
      <RequestResetContent />
    </Suspense>
  );
}

function RequestResetContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleRequestReset = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        throw new Error(resetError.message || "Failed to send reset email");
      }

      setSubmitted(true);
      toast.success("Check your email for a reset link!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reset email";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Toaster position="top-center" expand richColors />

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

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-3">
              <h3 className="text-3xl font-light text-black">Check Your Email</h3>
              <p className="text-sm text-black/50 leading-relaxed">
                We've sent a password reset link to <strong>{email}</strong>. Click the link to set a new password.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-xs text-black/40">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-black/50 hover:text-black transition-colors underline underline-offset-2"
              >
                Try another email
              </button>
            </div>

            <div className="pt-4 border-t border-black/5">
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

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-10 relative">
            <Link
              href="/login"
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center text-sm text-black/50 hover:text-black transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Link>
            <h3 className="text-3xl font-light text-black mb-3">Reset Your Password</h3>
            <p className="text-sm text-black/50 max-w-sm mx-auto leading-relaxed">
              Enter your email and we'll send you a link to create a new password.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-black/40 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                onKeyDown={(e) => e.key === "Enter" && !loading && handleRequestReset()}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <button
            onClick={handleRequestReset}
            disabled={!email.trim() || loading}
            className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Sending..." : "Send Reset Link"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
