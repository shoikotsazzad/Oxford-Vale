import { Inter, Playfair_Display, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";
import { rootMetadata } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const bangla = Hind_Siliguri({ subsets: ["bengali"], weight: ["400", "500", "600"], variable: "--font-hind", preload: false });

export const metadata = rootMetadata;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={site.lang} data-scroll-behavior="smooth" className={`${inter.variable} ${playfair.variable} ${bangla.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
