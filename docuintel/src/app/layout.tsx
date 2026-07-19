import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-body",
  display: "swap",
});

const poppinsDisplay = Poppins({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DocuIntel — AI-Powered Document Review",
  description: "Enterprise document intelligence platform for instant, explainable risk analysis of contracts and legal documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${poppinsDisplay.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body antialiased">
        <div className="crt-scanline" aria-hidden="true" />
        
        <MotionConfig reducedMotion="user">
          {children}
          <Toaster position="top-right" theme="dark" />
        </MotionConfig>
      </body>
    </html>
  );
}
