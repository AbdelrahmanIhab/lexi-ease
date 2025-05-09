import { Geist, Geist_Mono } from "next/font/google";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import "./globals.css";
import { Book } from "lucide-react";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Lexi-Ease",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="h-screen flex flex-col bg-purpleApp text-white">
        <NextAuthProvider>
          <main className="px-10">
            <Image
              src="/images/logo.png"
              alt="Lexi-Ease"
              width={300}
              height={100}
            />
            {children}
          </main>
        </NextAuthProvider>
      </body>
    </html>
  );
}
