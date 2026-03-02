import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AYAM GEPREK SAMBAL IJO - Pesanan Online",
  description: "Pedasnya Bikin Nagih - Pesanan online dengan WhatsApp integration",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            classNames: {
              success: 'border-2 border-green-500',
              error: 'border-2 border-red-500',
              warning: 'border-2 border-yellow-500',
              info: 'border-2 border-blue-500',
            }
          }}
        />
      </body>
    </html>
  );
}
