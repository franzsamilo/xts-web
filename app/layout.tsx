import type { Metadata } from "next";
import { Inter, Architects_Daughter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const architectsDaughter = Architects_Daughter({
  variable: "--font-architects-daughter",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "XTS WEB | Engineering Solutions & Fabrication",
  description: "E-Commerce, Fabrication Services, and Technical Community for Engineers.",
  icons: {
    icon: "/icon.svg",
  },
};

import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CartProvider } from "@/lib/cart-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`${inter.variable} ${architectsDaughter.variable} antialiased`}
      >
        <ThemeProvider>
          <SessionProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
