"use client";

import React, { useState, useEffect, useRef } from "react";
import { Toaster } from "sonner";
import { Menu, X, User, LogOut, ChevronDown, Calendar } from "lucide-react";
import { Hero } from "@/components/hero";
import { WelcomeTitle, Description } from "@/components/welcome";
import { Services } from "@/components/services";
import { Gallery, Footer } from "@/components/gallery-and-footer";
import { LocationMap } from "@/components/location-map";
import { Newsletter } from "@/components/newsletter";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

export default function App() {
  const [isScrolled, setIsScrolled]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isLoggedIn, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white">
      <Toaster position="top-center" expand={true} richColors />

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-black/95 backdrop-blur-md py-3 shadow-lg" : "bg-black py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">

          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Xclusive Barber Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-white font-montserrat transition-colors">
              XCLUSIVE BARBER
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8 text-[15px] font-semibold text-white font-montserrat">
            <a href="/" className="hover:text-neutral-400 transition-colors">Home</a>
            <a href="#services" className="hover:text-neutral-400 transition-colors">Services</a>
            <a href="#location" className="hover:text-neutral-400 transition-colors">Location</a>

            {/* Auth-aware nav item */}
            {isLoggedIn && user ? (
              /* Logged-in: avatar + dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen((o: boolean) => !o)}
                  className="flex items-center gap-2 hover:text-neutral-400 transition-colors"
                >
                  <div className="w-7 h-7 bg-white/10 border border-white/20 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${userDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-48 bg-white border border-black/10 shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-black/5">
                      <p className="text-xs font-semibold text-black truncate">{user.name}</p>
                      {user.phone && (
                        <p className="text-[11px] text-black/40 truncate">{user.phone}</p>
                      )}
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-black hover:bg-black/[0.04] transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-black/40" /> My Bookings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-black/60 hover:bg-black/[0.04] transition-colors border-t border-black/5"
                    >
                      <LogOut className="w-4 h-4 text-black/30" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Logged-out: single Login link */
              <Link href="/login" className="flex items-center gap-2 hover:text-neutral-400 transition-colors">
                <User className="w-4 h-4" />
                Login
              </Link>
            )}

            <Link
              href="/services"
              className="px-5 py-3 bg-accent text-accent-foreground hover:opacity-90 transition-all font-bold tracking-wide font-poppins"
            >
              BOOK NOW
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ─────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Slide-out panel */}
          <div className="absolute top-0 right-0 bottom-0 w-[80%] max-w-sm bg-accent shadow-2xl overflow-y-auto flex flex-col">
            <button
              className="absolute top-6 right-6 text-accent-foreground p-2 z-10"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>

            {/* User info (if logged in) */}
            {isLoggedIn && user && (
              <div className="pt-8 px-8 pb-6 border-b border-accent-foreground/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent-foreground/10 border border-accent-foreground/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-accent-foreground leading-tight">{user.name}</p>
                    {user.phone && (
                      <p className="text-xs text-accent-foreground/50">{user.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-16 px-8 flex flex-col gap-7 text-lg font-semibold text-accent-foreground font-montserrat flex-1">
              <a href="/" onClick={() => setMobileMenuOpen(false)} className="hover:opacity-70 transition-opacity">
                Home
              </a>
              <a href="#services" onClick={() => setMobileMenuOpen(false)} className="hover:opacity-70 transition-opacity">
                Services
              </a>
              <a href="#location" onClick={() => setMobileMenuOpen(false)} className="hover:opacity-70 transition-opacity">
                Location
              </a>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 hover:opacity-70 transition-opacity"
                  >
                    <Calendar className="w-5 h-5" /> My Bookings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-accent-foreground/70 hover:opacity-70 transition-opacity text-left"
                  >
                    <LogOut className="w-5 h-5" /> Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 hover:opacity-70 transition-opacity"
                >
                  <User className="w-5 h-5" /> Login / Sign Up
                </Link>
              )}
            </div>

            {/* Book CTA pinned to bottom */}
            <div className="px-8 pb-12 mt-auto">
              <Link
                href="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="block bg-black text-white px-8 py-4 text-center font-bold tracking-wide hover:opacity-90 transition-all font-montserrat"
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <main>
        <Hero />
        <section className="py-12 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 flex flex-col gap-8">
            <WelcomeTitle />
            <Description />
          </div>
        </section>
        <Gallery />
        <Services />
        <LocationMap />
        <Newsletter />
      </main>

      <Footer />
    </div>
  );
}
