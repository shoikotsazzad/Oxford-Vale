import { Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";
import { rootMetadata } from "@/lib/seo";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { LocalBusinessJsonLd } from "@/components/JsonLd";

// Bangla sites: swap to Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400","500","600","700"], variable: "--font-body" })
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata = rootMetadata;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={site.lang} className={`${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <LocalBusinessJsonLd />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <FloatingActions />
      </body>
    </html>
  );
}
