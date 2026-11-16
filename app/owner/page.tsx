import Link from "next/link";

import { Icon } from "@/src/components/ui/icon";
import { OwnerDashboardClient } from "@/src/components/owner-dashboard-client";

export const metadata = {
  title: "Owner dashboard",
  robots: { index: false, follow: false },
};

export default function OwnerPage() {
  return (
    <div className="page-container owner-layout">
      <aside className="owner-sidebar">
        <h2 className="text-base">Seller studio</h2>

        <nav
          aria-label="Owner dashboard navigation"
          className="mt-5"
        >
          <a href="#overview">
            Overview <Icon name="arrow" size={13} />
          </a>

          <a href="#orders">
            Orders <Icon name="arrow" size={13} />
          </a>

          <Link href="/browse">
            Storefront <Icon name="arrow" size={13} />
          </Link>
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-5">
          <h1 className="text-3xl">Your storefront</h1>

          <Link href="/" className="ui-link">
            View storefront <Icon name="arrow" size={14} />
          </Link>
        </header>

        <div id="overview" className="min-w-0">
          <OwnerDashboardClient />
        </div>
      </div>
    </div>
  );
}
