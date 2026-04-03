import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using the Xclusive Barber online booking service.",
  alternates: {
    canonical: "https://xclusivebarber.co.za/terms-of-service",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
