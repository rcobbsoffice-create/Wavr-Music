import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClientLayout from "@/components/ClientLayout";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "WAVR — Sell Beats, Own Your Sound",
  description:
    "The premier beat marketplace for independent producers. Sell instrumentals with flexible licensing, drop merch, and track every dollar.",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo-192.png",
  },
  openGraph: {
    images: [{ url: "/logo-192.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", "font-sans", geist.variable)}>

      <body className="min-h-full flex flex-col bg-gray-950 text-white">
        <ClientLayout>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ClientLayout>
      </body>
    </html>
  );
}
