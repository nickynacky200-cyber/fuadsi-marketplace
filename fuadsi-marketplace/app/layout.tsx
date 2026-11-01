import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap", weight: ["400", "500", "600", "700", "800"] });

const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: { default: "FUADSI Marketplace - Buy, Sell, Connect", template: "%s | FUADSI Marketplace" },
  description: "The campus marketplace for the Federal University of Agriculture and Development Studies, Iragbiji. Buy affordable products, sell your items and connect with fellow students.",
  openGraph: { title: "FUADSI Marketplace", description: "Buy - Sell - Connect on campus.", type: "website", images: ["/images/hero/mall.webp"] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#5415C6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen font-sans">
        <Providers>
          <Header />
          <main className="min-h-[70vh] pb-24 md:pb-0">{children}</main>
          <Footer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
