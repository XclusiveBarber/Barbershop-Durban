"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");

  const [status, setStatus] = useState<"confirming" | "success" | "error">("confirming");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!appointmentId) {
      setStatus("error");
      setErrorMessage("No appointment ID found.");
      return;
    }

    const confirmPayment = async () => {
      try {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to confirm payment.");
        }

        setStatus("success");
      } catch (err: any) {
        setErrorMessage(err.message || "Something went wrong.");
        setStatus("error");
      }
    };

    confirmPayment();
  }, [appointmentId]);

  if (status === "confirming") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-black/40" />
          <p className="text-black/60 text-sm">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm space-y-6">
          <div className="w-16 h-16 bg-red-50 flex items-center justify-center mx-auto">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-light text-black">Something went wrong</h1>
          <p className="text-black/50 text-sm">{errorMessage}</p>
          <Link
            href="/"
            className="inline-block bg-black text-white px-8 py-3 text-sm uppercase tracking-wider font-semibold hover:opacity-80 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm space-y-6">
        <div className="w-20 h-20 bg-black flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-light text-black">Payment Successful!</h1>
        <p className="text-black/55 text-sm leading-relaxed">
          Your appointment has been booked and payment confirmed. We look forward to seeing you!
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-black text-white px-8 py-3 text-sm uppercase tracking-wider font-semibold hover:opacity-80 transition-all"
        >
          View My Bookings
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-black/40" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
