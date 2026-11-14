import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { CartFeedback } from "@/src/components/cart-feedback";
import { CartProvider } from "@/src/components/cart-context";
import { SiteFooter } from "@/src/components/site-footer";
import { SiteHeader } from "@/src/components/site-header";
import "./globals.css";
import { isCatalogPreview } from "@/src/lib/catalog/preview-mode";

const dmSans = localFont({
  src: "../public/fonts/dm-sans-variable.ttf", variable: "--font-dm-sans",
  weight: "100 900", display: "swap", fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "ToneVault",
    template: "%s · ToneVault",
  },
  description:
    "Pre-owned and vintage guitars with condition notes and verification information. Demo checkout; no real payments.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const preview = isCatalogPreview();
  return (
    <html
      lang="en"
      className={`${dmSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <CartProvider storageKey={preview ? "tonevault-cart-preview" : undefined}>
          <Suspense fallback={<header className="site-header"><div className="site-header-row"><span className="wordmark">tonevault</span><span className="sr-only">Loading navigation</span></div></header>}><SiteHeader /></Suspense>
          {preview ? (
            <aside aria-label="Sample data preview" className="ui-preview-banner">
              <strong>Local sample preview</strong> — fictional inventory, grades and illustrative photos. No Supabase connection, saved orders or real payments.
            </aside>
          ) : null}
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
          <CartFeedback />
        </CartProvider>
      </body>
    </html>
  );
}
