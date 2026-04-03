import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Cancelled",
  robots: { index: false, follow: false },
};

export default function PaymentCancelledLayout({ children }: { children: React.ReactNode }) {
  return children;
}
