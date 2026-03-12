"use client";

/**
 * Login Page — Email OTP with Supabase
 *
 * Single flow: email → enter 6-digit OTP → dashboard (or name if new user)
 *
 * There is only ONE signup flow — the Customer flow.
 * Barbers/admins sign up here with their work email as normal customers.
 * The admin then manually sets their role in the Supabase dashboard.
 * On every subsequent login, their role is read from the database.
 */

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Toaster } from "sonner";
import Link from "next/link";
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

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

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
          <div className="pt-4">
            <OtpLoginForm onComplete={() => router.push(returnTo)} />
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-black/5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-black/30">
              Need help?{" "}
              <a href="tel:+27678864334" className="text-black/50 hover:text-black transition-colors">
                +27 678 86 433
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
