import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Xclusive Barber — how we collect, use, and protect your personal information.",
  alternates: {
    canonical: "https://xclusivebarber.co.za/privacy-policy",
  },
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
