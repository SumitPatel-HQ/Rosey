import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Bebas_Neue } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import GSAPProvider from "@/providers/GSAPProvider";
import LenisProvider from "@/providers/LenisProvider";
import BootProvider from "@/providers/BootProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rosey",
  description: "AI-powered outreach automation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `if ("scrollRestoration" in window.history) { window.history.scrollRestoration = "manual"; }`
            }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${bebasNeue.variable} font-sans antialiased`}
        >
          <BootProvider>
            <GSAPProvider>
              <LenisProvider>
                <ThemeProvider>
                  {children}
                  <Toaster />
                </ThemeProvider>
              </LenisProvider>
            </GSAPProvider>
          </BootProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
