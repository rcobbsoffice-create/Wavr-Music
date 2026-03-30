import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClientLayout from "@/components/ClientLayout";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WAVR — Sell Beats, Own Your Sound",
  description:
    "The premier beat marketplace for independent producers. Sell instrumentals with flexible licensing, drop merch, and track every dollar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-950 text-white">
        <ClientLayout>
          <Navbar />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </ClientLayout>
      </body>
    </html>
  );
}
