"use client";

/**
 * BookingSystem — 4-step booking wizard
 *
 * Step 1  Service selection (from Supabase)
 * Step 2  Date & barber selection
 * Step 2b Barber & time selection (available slots from Supabase)
 * Step 3  Identity gate  ← smart: skipped/pre-filled if already logged in
 * Step 4  Confirmation
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  Mail,
  LogIn,
  UserCheck,
  Scissors,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth, type AuthUser } from "@/context/auth-context";
import { OtpLoginForm } from "@/components/otp-login-form";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
  duration_minutes?: number;
}

interface Barber {
  id: string;
  name: string;
  specialty?: string;
  image_url?: string;
}

// Default time slots (static fallback)
const DEFAULT_TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30",
];

// ─── More Types ──────────────────────────────────────────────────────────────

// ─── Step-level sub-components ────────────────────────────────────────────────

function StepHeader({
  onBack,
  title,
}: {
  onBack?: () => void;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center text-sm hover:text-black transition-colors text-black/50"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </button>
      ) : (
        <div className="w-16" />
      )}
      <h3 className="text-2xl font-light text-black">{title}</h3>
      <div className="w-16" />
    </div>
  );
}

function BookingSummaryCard({
  service,
  date,
  time,
}: {
  service: Service;
  date: Date | undefined;
  time: string | null;
}) {
  // Compute estimated end time
  const endTime = (() => {
    if (!time || !service.duration_minutes) return null;
    const [h, m] = time.split(":").map(Number);
    const totalMins = h * 60 + m + service.duration_minutes;
    const eh = Math.floor(totalMins / 60) % 24;
    const em = totalMins % 60;
    return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  })();

  return (
    <div className="bg-black/[0.03] border-2 border-black/5 p-5 space-y-3 mb-6">
      <p className="text-[10px] uppercase tracking-widest text-black/30 font-medium mb-3">
        Booking Summary
      </p>
      <div className="flex justify-between text-sm">
        <span className="text-black/50 flex items-center gap-2">
          <Scissors className="w-3.5 h-3.5" /> Service
        </span>
        <span className="font-medium text-black">{service.name}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-black/50 flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5" /> Date
        </span>
        <span className="font-medium text-black">
          {date ? format(date, "EEE, MMM d") : "—"}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-black/50 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> Time
        </span>
        <span className="font-medium text-black">
          {time ?? "—"}
          {endTime && (
            <span className="text-black/40 font-normal"> – {endTime}</span>
          )}
          {service.duration_minutes && (
            <span className="text-black/30 font-normal text-xs ml-1">
              ({service.duration_minutes} min)
            </span>
          )}
        </span>
      </div>
      <div className="pt-3 border-t border-black/10 flex justify-between">
        <span className="font-semibold text-sm text-black">Total</span>
        <span className="font-semibold text-sm text-black">{service.price}</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BookingSystem({ hideTitle = false }: { hideTitle?: boolean }) {
  const { user, isLoggedIn, login, accessToken } = useAuth();

  // Data state
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Wizard state
  const [step, setStep]               = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber]   = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate]       = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime]       = useState<string | null>(null);

  const goNext = () => setStep((s) => s + 1);
  const goPrev = () => setStep((s) => s - 1);

  // Load services and barbers on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesRes, barbersRes] = await Promise.all([
          fetch("/api/haircuts"),
          fetch("/api/barbers"),
        ]);

        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setServices(Array.isArray(data) ? data : (data.haircuts || []));
        }

        if (barbersRes.ok) {
          const data = await barbersRes.json();
          setBarbers(Array.isArray(data) ? data : (data.barbers || []));
        }
      } catch (error) {
        console.error("Failed to load booking data:", error);
        toast.error("Failed to load available services");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const res = await fetch(`/api/availability?date=${dateStr}`);
        const data = await res.json();
        // C# returns { available_slots: [...] } — slots that still have a free barber
        setAvailableSlots(data.available_slots || DEFAULT_TIME_SLOTS);
      } catch (error) {
        console.error("Failed to fetch availability:", error);
        setAvailableSlots(DEFAULT_TIME_SLOTS);
      }
    };

    fetchSlots();
  }, [selectedDate]);

  // ── Step 3 helpers ────────────────────────────────────────────────────────

  /** Called when user wants to enter step 3 */
  const enterStep3 = () => {
    setStep(3);
  };

  // ── Submission ────────────────────────────────────────────────────────────

  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);

  /** Show the external-redirect warning modal before initiating payment */
  const handleConfirm = () => {
    if (!isLoggedIn || !user) {
      toast.error("You must be logged in to confirm your booking.");
      return;
    }
    setShowPaymentWarning(true);
  };

  /** Called after the user accepts the redirect warning */
  const handleProceedToPayment = async () => {
    setShowPaymentWarning(false);
    setIsRedirectingToPayment(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      // Step 1: Create the appointment
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          haircutId: selectedService!.id,
          appointmentDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
          timeSlot: selectedTime,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create appointment";
        try {
          const text = await response.text();
          if (text) {
            try {
              const error = JSON.parse(text);
              errorMessage = error.error || error.message || error.title || (typeof error === "string" ? error : null) || errorMessage;
            } catch {
              errorMessage = text;
            }
          }
        } catch { /* ignore */ }
        throw new Error(errorMessage);
      }

      const appointment = await response.json();
      const appointmentId = appointment.id;

      // Step 2: Create Yoco checkout session
      // ADDED: process.env.NEXT_PUBLIC_API_URL to ensure it hits Azure
      const checkoutRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/payments/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedService!.price,
          appointmentId,
        }),
      });
      if (!checkoutRes.ok) {
        const errText = await checkoutRes.text();
        throw new Error(`Payment setup failed: ${errText}`);
      }
      const data = await checkoutRes.json();
      console.log("Data returned from Azure:", data); // Helps us debug if it fails again!
      // Step 3: Extract URL safely (catches capitalization differences from C#)
      const finalRedirectUrl = data.redirectUrl || data.RedirectUrl || data.redirecturl || data.redirect_url || data.url;
      if (!finalRedirectUrl) {
         throw new Error("Azure returned success, but the Yoco URL was missing. Check the console log!");
      }
      // Step 4: Redirect to Yoco hosted payment page
      toast.success("Redirecting to payment...");
      window.location.href = finalRedirectUrl;
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to create appointment");
      setIsRedirectingToPayment(false);
    }
  };

  // ── Policy items ──────────────────────────────────────────────────────────

  const BOOKING_POLICIES = [
    { icon: "⏰", title: "Advance booking", detail: "Appointments must be booked at least 30 minutes in advance." },
    { icon: "🔁", title: "One reschedule only", detail: "Each appointment may be rescheduled once, with at least 2 hours' notice." },
    { icon: "⚠️", title: "Late arrival fee", detail: "Arriving 15–29 minutes late incurs a R10 fee. Arrivals 30+ minutes late must reschedule." },
    { icon: "❌", title: "Cancellations", detail: "Cancellations are permitted before your appointment time. No-shows are not refunded." },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section id="book" className="py-24 bg-white">
      <style>{`
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #000000;
          --rdp-background-color: #f3f3f3;
          margin: 0;
        }
        .rdp-day_selected,
        .rdp-day_selected:focus-visible,
        .rdp-day_selected:hover {
          background-color: var(--rdp-accent-color) !important;
          color: white !important;
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-6">
        {!hideTitle && (
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4 tracking-tight text-black font-montserrat">
              Book Your Appointment
            </h2>
            <p className="text-black/60 max-w-lg mx-auto font-open-sans">
              Select your service and time — we'll handle the rest.
            </p>
          </div>
        )}

        <div className="bg-white border border-black/10 overflow-hidden shadow-sm">
          {/* Progress bar — 4 steps */}
          <div className="flex border-b border-black/5">
            {(["Service", "Date & Time", "Your Details", "Done"] as const).map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 py-3 px-1">
                <div className={`h-1 w-full transition-colors duration-500 ${step > i ? "bg-accent" : step === i + 1 ? "bg-accent" : "bg-black/5"}`} />
                <span className={`text-[9px] uppercase tracking-widest hidden sm:block transition-colors ${step === i + 1 ? "text-black/70 font-semibold" : step > i + 1 ? "text-black/30" : "text-black/20"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">

              {/* ─── Step 1: Service ──────────────────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <h3 className="text-2xl font-semibold mb-8 text-black font-montserrat">
                    Choose a Service
                  </h3>
                  {loadingData ? (
                    <div className="text-center py-12 text-black/50">Loading services...</div>
                  ) : services.length === 0 ? (
                    <div className="text-center py-12 text-black/50">No services available</div>
                  ) : (
                    <div className="grid gap-3">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => { setSelectedService(service); goNext(); }}
                          className={`flex items-center justify-between p-5 border-2 text-left transition-all hover:border-black group ${
                            selectedService?.id === service.id
                              ? "border-black bg-black/[0.02]"
                              : "border-black/10"
                          }`}
                        >
                          <div>
                            <p className="font-medium text-base text-black">{service.name}</p>
                            <p className="text-xs text-black/40 mt-0.5">{service.description || "Haircut service"}</p>
                            {service.duration_minutes && (
                              <p className="text-xs text-black/30 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {service.duration_minutes} min
                              </p>
                            )}
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <p className="font-semibold text-base text-black">R{service.price}</p>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-black" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─── Step 2: Date & Time ──────────────────────────── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <StepHeader onBack={goPrev} title="Select Date & Time" />

                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="flex justify-center border border-black/10 p-4">
                      <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={{ before: new Date() }}
                        className="p-0 m-0"
                      />
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs font-medium uppercase tracking-widest text-black/40 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Available Times
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {availableSlots.length === 0 ? (
                          <p className="col-span-2 text-xs text-black/40 py-4">Loading available times...</p>
                        ) : (
                          availableSlots.map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`p-3 text-sm border-2 transition-all ${
                                selectedTime === time
                                  ? "bg-black text-white border-black"
                                  : "border-black/10 hover:border-black text-black"
                              }`}
                            >
                              {time}
                            </button>
                          ))
                        )}
                      </div>
                      <button
                        disabled={!selectedTime || !selectedDate}
                        onClick={enterStep3}
                        className="w-full bg-accent text-accent-foreground py-4 mt-4 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90 font-medium text-sm uppercase tracking-wide"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─── Step 3: Identity gate ────────────────────────────── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* ── Already logged in ─────────────────────────────── */}
                  {isLoggedIn && user ? (
                    <>
                      <StepHeader onBack={goPrev} title="Confirm Booking" />
                      <BookingSummaryCard service={selectedService!} date={selectedDate} time={selectedTime} />
                      <div className="flex items-center gap-3 p-4 border-2 border-black/10 bg-black/[0.02]">
                        <UserCheck className="w-5 h-5 text-black/40 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-black">{user.name}</p>
                          <p className="text-xs text-black/40">{user.email}</p>
                        </div>
                      </div>

                      {/* ── Booking Policies ──────────────────────────── */}
                      <div className="border-2 border-black/10 p-5">
                        <p className="text-[10px] uppercase tracking-widest text-black/40 font-medium mb-4 flex items-center gap-2">
                          <ShieldAlert className="w-3.5 h-3.5" /> Booking Policies
                        </p>
                        <ul className="space-y-3">
                          {BOOKING_POLICIES.map((policy) => (
                            <li key={policy.title} className="flex gap-3 text-sm">
                              <span className="text-base leading-none mt-0.5">{policy.icon}</span>
                              <span>
                                <span className="font-medium text-black">{policy.title}: </span>
                                <span className="text-black/50">{policy.detail}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* ── External Payment Notice ────────────────────── */}
                      <div className="flex items-start gap-3 p-4 border-2 border-amber-200 bg-amber-50">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                          By clicking <strong>Confirm &amp; Pay</strong> you will be redirected to{" "}
                          <strong>Yoco</strong>, our secure external payment provider, to complete
                          your transaction. You will be returned to this site after payment.
                        </p>
                      </div>

                      <button
                        onClick={handleConfirm}
                        disabled={isRedirectingToPayment}
                        className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isRedirectingToPayment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Securing your slot…
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            Confirm &amp; Pay via Yoco
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    /* ── Not logged in — auth gate ─────────────────────── */
                    <div className="pt-2">
                      <OtpLoginForm 
                        onComplete={() => {}} 
                        onBackAction={goPrev} 
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─── Step 4: Confirmation ─────────────────────────────── */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="text-center py-10 space-y-6"
                >
                  <div className="w-20 h-20 bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>

                  <h3 className="text-3xl font-light text-black">
                    Booking Confirmed!
                  </h3>

                  <p className="text-black/55 max-w-sm mx-auto text-sm leading-relaxed">
                    {`Thanks, ${user?.name ?? ""}. Your ${selectedService?.name} on ${
                      selectedDate ? format(selectedDate, "EEE, MMM d") : ""
                    } at ${selectedTime} is confirmed. A barber will be assigned to you.`}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link
                      href="/dashboard"
                      className="bg-accent text-accent-foreground px-8 py-3 text-sm uppercase tracking-wider font-semibold hover:opacity-90 transition-all font-montserrat"
                    >
                      View My Bookings
                    </Link>
                    <button
                      onClick={() => {
                        setStep(1);
                        setSelectedService(null);
                        setSelectedTime(null);
                      }}
                      className="border-2 border-black/10 text-black/50 px-8 py-3 text-sm uppercase tracking-wider font-semibold hover:border-black/30 hover:text-black transition-all font-montserrat"
                    >
                      Book Again
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Payment Redirect Warning Modal ────────────────────────────────── */}
      {showPaymentWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
            className="bg-white max-w-md w-full p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-amber-100 flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="text-lg font-semibold text-black">
                You&apos;re leaving this site
              </h4>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-6">
              You will be redirected to <strong className="text-black">Yoco</strong>, a secure
              third-party payment provider, to complete your payment of{" "}
              <strong className="text-black">R{selectedService?.price}</strong>. After a
              successful payment you will be brought back here automatically.
            </p>
            <p className="text-xs text-black/40 mb-8">
              Your appointment slot will be held while you complete payment. If you close the Yoco
              page without paying, the booking will remain pending.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleProceedToPayment}
                className="flex-1 bg-accent text-accent-foreground py-3 text-sm uppercase tracking-widest font-semibold font-montserrat hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Continue to Payment
              </button>
              <button
                onClick={() => setShowPaymentWarning(false)}
                className="flex-1 border-2 border-black/10 text-black/50 py-3 text-sm uppercase tracking-widest font-semibold font-montserrat hover:border-black/30 hover:text-black transition-all"
              >
                Go Back
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
