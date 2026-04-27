import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClientLayout from "@/components/ClientLayout";


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
    <html lang="en" className="h-full antialiased">

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
