"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, User, Calendar, LogOut } from "lucide-react";
import { BookingSystem } from "@/components/booking-system";
import { Toaster } from "sonner";
import { useAuth } from "@/context/auth-context";
import "react-day-picker/dist/style.css";

export default function ServicesPage() {
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" expand={true} richColors />

      {/* Header */}
      <header className="bg-black py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Xclusive Barber Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-white font-montserrat">
              XCLUSIVE BARBER
            </span>
          </Link>

          {/* Right side — auth-aware */}
          <div className="flex items-center gap-5">
            {isLoggedIn && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors font-semibold font-montserrat"
                >
                  <Calendar className="w-4 h-4" />
                  My Bookings
                </Link>
                <span className="hidden sm:flex items-center gap-2 text-sm text-white/50 font-montserrat">
                  <User className="w-4 h-4" />
                  {user.name.split(" ")[0]}
                </span>
                <button
                  onClick={logout}
                  className="hidden sm:flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors font-montserrat"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                href={`/login?returnTo=/services`}
                className="hidden sm:flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors font-semibold font-montserrat"
              >
                <User className="w-4 h-4" />
                Sign in to save bookings
              </Link>
            )}

            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors font-semibold font-montserrat"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
        </div>
      </header>

      <BookingSystem hideTitle={true} />
    </div>
  );
}
