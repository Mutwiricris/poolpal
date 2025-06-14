import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// Removing Toaster from the root layout
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PoolPal - Pool Management System",
  description: "A simple and effective pool management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          {/* Toaster removed from root layout */}
        </AuthProvider>
      </body>
    </html>
  );
}
