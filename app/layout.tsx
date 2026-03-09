import type { Metadata } from "next";
import { Montserrat, Poppins, Open_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/context/auth-context";
import "./globals.css";

const montserrat = Montserrat({ 
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "XCLUSIVE BARBER - Davenport, Durban | All Types of XCLUSIVE Haircuts",
  description:
    "XCLUSIVE BARBER in Davenport, Durban. All types of XCLUSIVE haircuts, hair colouring, bald cuts (chiskop), beard services, and hectic designs. Book now at 121 Helen Joseph Rd, Bulwer.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/logo2 (2).png",
      },
      {
        url: "/favicon.ico",
      },
    ],
    apple: "/logo2 (2).png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${poppins.variable} ${openSans.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
