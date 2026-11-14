import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-panel">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>ToneVault — pre-owned and vintage instruments. Simulated checkout; no real payments.</p>
        <div className="flex gap-5">
          <Link href="/browse" className="hover:text-foreground">
            Catalog
          </Link>
          <Link href="/browse?verificationStatus=Fully%20Verified" className="hover:text-foreground">
            Fully Verified
          </Link>
        </div>
      </div>
    </footer>
  );
}
