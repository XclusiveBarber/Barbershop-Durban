"use client";

/**
 * Login Page — Email OTP with Supabase
 *
 * Customer flow:  email → enter 8-digit code → dashboard (or name if new user)
 * Staff flow:     email → password → check role → dashboard
 */

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { OtpLoginForm } from "@/components/otp-login-form";

// ─── Main wrapper ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────

type LoginMode = "customer" | "staff";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

  // Mode
  const [mode, setMode] = useState<LoginMode>("customer");

  // Staff flow
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // ─ Staff flow ─────────────────────────────────────────────────────────────

  const validateStaffEmail = (email: string): { valid: boolean; role: "admin" | "staff" | null } => {
    const trimmed = email.trim();

    // Check if email has @xclusivebarber.co.za domain
    if (!trimmed.endsWith("@xclusivebarber.co.za")) {
      return { valid: false, role: null };
    }

    // Check if it's the admin account
    if (trimmed === "admin@xclusivebarber.co.za") {
      return { valid: true, role: "admin" };
    }

    // Any other @xclusivebarber.co.za is staff
    return { valid: true, role: "staff" };
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail.trim() || !staffPassword.trim()) {
      setStaffError("Email and password required");
      return;
    }

    const emailValidation = validateStaffEmail(staffEmail);
    if (!emailValidation.valid) {
      setStaffError("Email must end with @xclusivebarber.co.za");
      return;
    }

    setStaffError(null);
    setStaffLoading(true);

    try {
      // TODO: Implement real staff/admin authentication with password verification
      toast.error("Staff login requires Supabase configuration");
    } finally {
      setStaffLoading(false);
    }
  };

  // ─ Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster position="top-center" expand richColors />

      {/* Header */}
      <nav className="bg-black py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Xclusive Barber" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-white font-montserrat">
              XCLUSIVE BARBER
            </span>
          </Link>
          <Link
            href={returnTo.startsWith("/") && returnTo !== "/dashboard" ? returnTo : "/"}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* CUSTOMER MODE */}
          {mode === "customer" && (
            <div className="pt-4">
              <OtpLoginForm onComplete={() => router.push(returnTo)} />
            </div>
          )}

          {/* STAFF MODE */}
          {mode === "staff" && (
            <motion.div
              key="staff"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-12">
                <span className="text-black/30 uppercase tracking-widest text-xs mb-4 block">
                  Staff Portal
                </span>
                <h1 className="text-4xl font-light tracking-tight text-black mb-4">
                  Staff Sign In
                </h1>
                <p className="text-black/50 text-sm leading-relaxed">
                  Barbers, admins, and team members. Use your @xclusivebarber.co.za email.
                </p>
              </div>

              <form onSubmit={handleStaffLogin} className="space-y-4">
                {staffError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{staffError}</p>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-black/40 font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => {
                        setStaffEmail(e.target.value);
                        setStaffError(null);
                      }}
                      placeholder="you@xclusivebarber.co.za"
                      className="w-full pl-12 pr-4 py-4 border-2 border-black/10 text-black placeholder:text-black/20 focus:border-black focus:outline-none transition-all bg-white"
                      disabled={staffLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-black/40 font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <input
                      type="password"
                      value={staffPassword}
                      onChange={(e) => {
                        setStaffPassword(e.target.value);
                        setStaffError(null);
                      }}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 border-2 border-black/10 text-black placeholder:text-black/20 focus:border-black focus:outline-none transition-all bg-white"
                      disabled={staffLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={staffLoading}
                  className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {staffLoading ? "Signing in…" : "Sign In"}
                </button>
              </form>

              <div className="mt-6 p-4 bg-black/5 rounded text-xs text-black/50 text-center">
                Contact your admin for staff account setup.
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-black/5 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.2em] text-black/30">
              Need help?{" "}
              <a href="tel:+27678864334" className="text-black/50 hover:text-black transition-colors">
                +27 678 86 433
              </a>
            </p>
            <button
              onClick={() => setMode(mode === "customer" ? "staff" : "customer")}
              className="text-[11px] uppercase tracking-[0.2em] text-black/20 hover:text-black/40 transition-colors"
            >
              {mode === "customer" ? "Staff Portal →" : "← Customer"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
