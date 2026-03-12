"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm space-y-6">
        <div className="w-20 h-20 bg-black/5 flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-black/40" />
        </div>
        <h1 className="text-3xl font-light text-black">Payment Cancelled</h1>
        <p className="text-black/55 text-sm leading-relaxed">
          Your payment was cancelled. Your appointment slot has been reserved but will remain unpaid until you complete payment.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/dashboard"
            className="bg-black text-white px-8 py-3 text-sm uppercase tracking-wider font-semibold hover:opacity-80 transition-all"
          >
            View My Bookings
          </Link>
          <Link
            href="/#book"
            className="border-2 border-black/10 text-black/50 px-8 py-3 text-sm uppercase tracking-wider font-semibold hover:border-black/30 hover:text-black transition-all"
          >
            Book Again
          </Link>
        </div>
      </div>
    </div>
  );
}
