import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ReceiptAI",
  description: "Scan and analyze your receipts with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#F9FAFB]`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
