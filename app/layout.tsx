import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { CartProvider } from "@/src/components/cart-context";
import { SiteFooter } from "@/src/components/site-footer";
import { SiteHeader } from "@/src/components/site-header";
import "./globals.css";
import { isCatalogPreview } from "@/src/lib/catalog/preview-mode";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "ToneVault",
    template: "%s · ToneVault",
  },
  description:
    "Explore pre-owned and vintage guitars with condition notes and verification labels. Course prototype with simulated checkout.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const preview = isCatalogPreview();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <CartProvider storageKey={preview ? "tonevault-cart-preview" : undefined}>
          <SiteHeader />
          {preview ? (
            <aside aria-label="Sample data preview" className="border-b border-gold/30 bg-panel px-4 py-3 text-center text-sm leading-6 text-gold-soft">
              <strong>Local sample preview</strong> — fictional inventory, grades and illustrative photos. No Supabase connection, saved orders or real payments.
            </aside>
          ) : null}
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
