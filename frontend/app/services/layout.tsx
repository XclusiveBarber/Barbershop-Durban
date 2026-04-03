import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Haircut",
  description:
    "Book your appointment at Xclusive Barber in Davenport, Durban. Choose your service, pick a date and time, and pay securely online. Haircuts, fades, chiskop, beard trims & more.",
  alternates: {
    canonical: "https://xclusivebarber.co.za/services",
  },
  openGraph: {
    title: "Book a Haircut | Xclusive Barber Durban",
    description:
      "Book your appointment online. Choose your service, pick a time, and pay securely. Xclusive Barber — 121 Helen Joseph Rd, Bulwer, Durban.",
    url: "https://xclusivebarber.co.za/services",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
