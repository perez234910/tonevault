# ToneVault business documentation (GC2)

| Item | Detail |
| --- | --- |
| Primary business source | Original GC1 proposal, *tonevault — Authenticated Guitars, Standardized Grading, Risk-Free Deals* (Group 2). Page numbers refer to the PDF page sequence (pp. 1–8 contain text; pp. 9–14 contain mockup images only). |
| Implementation evidence | Source code on the Member 2 pull-request stack, head `3ec7fcd` (PR #35, `g2/m2-search-challenge3`). This stack includes the Cart, Detail, Checkout, Confirmation and Owner PRs (#22–#33). PR #18 (`g2/m2-browse-api`) is a separate branch. As of the 8 November 2026 audit, **none of these PRs is merged into `main` (`6112d47`)**, and no public deployment has been verified. `docs/routes.md` audits `main` only, so screens it lists as missing exist on this PR stack but not yet on `main`. |
| Sections owned by Member 2 | §1 GC1 traceability; §2 customer funnel |
| Sections owned by other members | §3 Member 4 (owner-stated business rules, revenue features, worked examples, conclusions); §4 Member 5 (dashboard metric decisions) |

**Status legend.**
- **Complete:** working in branch code for GC2 scope.
- **Partial:** some of the GC1 concept is in code and the rest is missing or simulated.
- **Not implemented:** no code exists yet.
- **Planned (Final Project):** assigned to GC1 Phase 2 (p. 8).

"Complete" does not mean merged, deployed or tested against a live database.

---

## 1. GC1 traceability

### 1.1 Summary table

| Category | GC1 reference | Where it appears in ToneVault | How the implementation supports the concept | Status |
| --- | --- | --- | --- | --- |
| **Target market** | "Primary buyer personas include vintage collectors, professional session musicians, boutique instrument dealers, and serious gear enthusiasts." Psychographics: "Their primary friction is fear" (p. 1, *Target Market Profile*). Porter's assessment recommends an initial focus on premium, vintage and collectible guitars (p. 3). | `scripts/seed.ts` defines 8 Fender, Gibson and PRS listings from 1954–2016 (7 built before 1973), priced ₱168,000–₱3,450,000. The `/browse` price bands in `src/components/filter-bar.tsx` run from "Under ₱250,000" to "₱1,500,000+". The `/` copy reads "Pre-owned guitars, with condition notes and verification details to help you choose." | Catalog content and price filters are set up for high-value pre-owned instruments, not listing volume. This matches the Lean Canvas implication that "Its advantage should come from trust, verification, and specialization" (p. 2). | **Partial.** Serves the buyer personas. There is no seller, dealer or luthier interface. `user_role` (`buyer`, `seller`, `admin`, `luthier`) exists in the schema, but there is no sign-in or account UI. |
| **Customer problem** | "The secondary guitar market relies on subjective seller descriptions and non-standardized photos on generalist platforms." Payment release means "buyers assume 100% of the financial risk during online transactions" (p. 1, *Problem Statement*). | `products` table (`supabase/migrations/20241107000000_init_core_tables.sql`): `verification_status` enum, `tonevault_score` constrained to 1–100, `condition_notes`. The `products_protect_verification` trigger blocks non-admin changes to status and score, and the insert policy forces new seller listings to `Unverified`. `/products/[id]` has a "Verification documentation" section (`src/components/product-detail-view.tsx`). `src/lib/catalog-photography.ts` labels model images "Model reference only; not a photograph of this vintage listing or verification evidence." | Structured, protected fields replace free-form seller claims on condition and authenticity. The labelled reference images avoid presenting unverified photography as evidence. | **Partial.** Description standardization is implemented. Listing images are model reference photos, not authenticated photographs of the listed instrument. The financial-risk half of the problem is not addressed, because payment is simulated. |
| **Value proposition** | "ToneVault replaces buyer risk with verified certainty." Each instrument undergoes a "standardized 100-point inspection matrix … to generate a digital ToneVault Score (1–100)". "Transactions are secured by an integrated escrow mechanism" (pp. 1–2, *Value Proposition*). | `VerificationBadge` and `ScoreBadge` (`src/components/verification-badge.tsx`) appear on product cards and on `/products/[id]`. Unscored listings show "Score pending". `buildInspectionMetrics` (`src/lib/catalog/queries.ts`) maps each tier to `inspection_level` (`none`, `remote`, `in_person`). The `escrow_status` enum (`pending` → `payout_released`) is displayed as a progress list on `/confirmation/[id]`. | Buyers see the verification tier and score before they select an instrument. This makes the "verified certainty" promise visible at the point of decision. | **Partial.** Score and tier display are complete. Scores and tiers are **seeded sample values**: there is no inspection-record table or scoring engine (GC1 Phase 2, p. 8). Escrow exists only as status labels. No funds are held or released. Escrow is **Planned (Final Project)**. |
| **Monetization** | Hybrid model: "8% Marketplace Commission", charged "to sellers for every completed guitar sale"; verification fees; Pro Seller Subscription at "Approximately ₱1,650 per month"; and sponsored listings, where "Any seller may pay to increase the visibility of a listing" (pp. 3–4, *Monetization Models*). | Member 4 PRs [#40](https://github.com/perez234910/tonevault/pull/40)–[#42](https://github.com/perez234910/tonevault/pull/42) implement the two selected GC2 streams: an 8% seller commission and optional verification (`none`, ₱2,800 remote, ₱8,500 physical). `ACTIVE_PRICING_RULES` owns the active values; `calculateOrderPricing` uses integer centavos; the order migration stores the pricing snapshot. | Commission aligns platform income with saved sales. Optional verification monetizes ToneVault's trust service without forcing every buyer to pay for it. The browser cannot choose the price or total. | **Implemented on the unmerged Member 4 stack; not deployed.** The migration has not been applied to the shared database and payment remains simulated. Subscriptions and promoted listings remain out of GC2 scope. |
| **Core platform features** | Nine features listed under *Core Platform Features* (p. 4). See §1.2. | See §1.2. | See §1.2. | **Partial.** Features 1–4 are partly or largely present. Features 5–9 are simulated, display-only or not implemented. |

### 1.2 Core platform features (GC1 p. 4)

| # | GC1 feature (quoted) | ToneVault implementation | Status |
| --- | --- | --- | --- |
| 1 | "Guitar marketplace listings with photos, specifications, price, and seller details" | `/products/[id]`: `ProductGallery`, "Technical specifications" list (brand, model, year, finish, status, Vault ID), `PurchaseBar` price, and "Seller" section (name, role, member-since year). Data comes from `GET /api/products/:id`, which returns no seller email. | **Partial.** Photos are model references or absent, not photographs of each listed instrument. |
| 2 | "Search and filtering by brand, model, price, condition, verification status, and ToneVault Score" | `/browse` `FilterBar`: keyword search (matches brand, model, finish and condition notes), Brand, Price, Verification, Condition and Availability. These map to `GET /api/products` query parameters validated by `productFiltersSchema`. PR #35 adds search autocomplete (`src/components/catalog-search.tsx`, `src/lib/catalog-search.ts`) to the header, mobile drawer and `/browse` search fields. It suggests brands and specific instruments from `GET /api/products`. | **Partial.** There is no ToneVault Score filter or sort. Model is searchable only by keyword or autocomplete. The condition filter is a text match on `condition_notes`, not a standardized grade. |
| 3 | "Unverified, Remote Verified, and Fully Verified listing options" | `verification_status` enum, badge, filter and tier-specific copy on `/products/[id]`. The Home page links to `/browse?verificationStatus=Fully%20Verified`. | **Partial.** Tiers display and filter correctly. There is no remote-verification or physical-inspection workflow, and no seller request flow. |
| 4 | "Standardized ToneVault Score (1–100) for physically inspected guitars" | `tonevault_score` integer with a 1–100 database check. In the seed data, only `Fully Verified` listings have a score. | **Partial.** Display only. The 100-point inspection form and scoring algorithm are **Planned (Final Project)** (p. 8). |
| 5 | "Secure checkout and online payment processing" | `/checkout` (`src/components/checkout-screen.tsx`) is a four-step wizard (Contact, Shipping, Payment, Review) with per-step validation (`src/lib/checkout-validation.ts`). Payment choices are "Card · simulated" and "Bank transfer · simulated", and the page states "No money is charged." "Place order" is disabled. | **Partial.** The interface is complete. Payment is **simulated**: no PayMongo or Stripe integration exists. The UI does not submit orders. |
| 6 | "Escrow-style payment protection with a 48-hour buyer approval period" | `escrow_status` enum values only. There is no timer, hold or payout logic. | **Planned (Final Project).** GC1 Phase 2 "Escrow Payout Engine" (p. 8). |
| 7 | "Seller-provided courier and tracking number" | `orders.tracking_number` column. `/confirmation/[id]` shows the value or "Not provided". | **Partial.** Storage and display only. There is no seller input screen. |
| 8 | "Pro Seller dashboard with sales and inventory analytics" | `/owner` layout (`app/owner/page.tsx`) has five metric slots (Total orders, Total revenue, Average order value, Top-selling instrument, Low-stock instruments) marked "Unavailable", and an `OwnerOrders` table in the unavailable state. | **Partial.** Layout only. The data needs `GET /api/metrics` (Member 5) and `GET /api/orders` (Member 3), and neither exists. The full Pro Dealer dashboard is **Planned (Final Project)** (p. 8). |
| 9 | "Sponsored listing and promotion features" | None. | **Not implemented.** |

### 1.3 GC1 Phase 1 roadmap (GC2 scope, p. 8)

| GC1 Phase 1 item | Current state | Status |
| --- | --- | --- |
| "Authentication & User Profiles" | `users` table, role enum and `handle_new_user` trigger exist. There is no sign-in UI. `POST /api/orders` accepts `buyer_id` in the request body. | **Not implemented** (UI/auth) |
| "Core Product Catalog & Filtering" | `/`, `/browse`, `GET /api/products` | **Complete** for brand, year, price, verification and condition tags (see §1.2 #2 for the gaps) |
| "Instrument Detail Page (PDP)" | `/products/[id]` with gallery, specifications, price, seller and "Add to cart" | **Complete** (photography caveat in §1.2 #1) |
| "Cart & Standard Checkout" | `/cart` (localStorage key `tonevault-cart`) and `/checkout` shipping form | **Partial.** Simulated payment replaces "basic Stripe payment gateway integration". The GC2 requirements state that no real payments are required. |
| "Basic Order Management" | `place_catalog_order` RPC locks the listing, inserts the order, decrements stock and sets `sold` when stock reaches 0, all in one transaction. The confirmation UI is built. | **Partial.** Orders can be created only by calling `POST /api/orders` directly. `GET /api/orders/:id` is missing, so no receipt can be displayed. |

---

## 2. Customer funnel (Browse → Select → Confirm → Save)

Target customer, from GC1 p. 1: buyers of premium pre-owned and vintage guitars whose "primary friction is fear" of counterfeit instruments, hidden repairs or non-original parts.

### 2.1 Funnel implementation (factual)

| Stage | Page / screen | UI elements used | Supporting API endpoint | Working | Incomplete |
| --- | --- | --- | --- | --- | --- |
| **Browse** | `/` (featured collection), `/browse`, and the header search on every page | Keyword search and five selects (`FilterBar`) kept in URL query parameters. Search autocomplete (PR #35): after two characters and a 200 ms pause it shows up to three brand and six instrument suggestions, each labelled "Brand" or "Instrument". It supports keyboard and touch selection, with loading, empty ("No suggestions. You can still submit your search.") and failure ("Suggestions unavailable. You can still submit your search.") messages. Free-text submission still works. `ProductCard` grid with year, finish, price, `VerificationBadge`, `ScoreBadge`, "Model reference photo" label and "Sold out" tag. Result count. Loading skeleton, empty state ("No instruments match these filters.") and error message. | `GET /api/products`. Autocomplete fetches it directly (`query`, `status`, `limit=6`). The `/browse` result grid calls the same `queryProducts` function through the `getProducts` server action. PR #18 (unmerged) switches the grid to fetch the JSON endpoint. | Filtering, URL-shareable filters, autocomplete. A brand suggestion opens `/browse?brand=…` and an instrument suggestion opens `/products/[id]`. | No ToneVault Score filter or sort. Suggestions show names only, without verification tier or score. PRs #18 and #35 not merged. |
| **Select** | `/products/[id]`, `/cart` | Gallery with reference disclaimer, technical specifications, verification documentation (tier copy, condition notes, ToneVault Score shown out of 100), seller panel, `PurchaseBar` ("Buy now", "Add to cart", stock limit, "Simulated checkout · no real payment"). Cart quantity controls capped by stock, line subtotals, selection summary, and "Adding to your cart does not reserve an instrument." | `GET /api/products/:id` (`src/lib/product-detail-client.ts` validates the response with Zod). The cart is client-side and has no endpoint. | Detail loading, not-found and retry states. Persistent cart. | The cart is a preview and does not reserve stock. |
| **Confirm** | `/checkout` | Four-step progress list, labelled fields with inline errors, simulated payment radio options, review panel with edit links, catalog price and stock refresh, "Shipping / fees" listed as "Not calculated", and a disabled "Place order unavailable" button with an explanation. | `POST /api/orders` exists: single product, server-computed total, atomic stock decrement. **The checkout UI does not call it.** Checkout re-reads each item through `GET /api/products/:id`. | Validation, price refresh | Order submission, buyer identity (no auth), multi-item cart vs single-product order contract, no contact or shipping columns in `orders`. GC1's "interactive buyer-protection escrow acknowledgments" (p. 5) is absent. |
| **Save** | `/confirmation` (order lookup), `/confirmation/[id]`, `/owner` | Reference input with UUID validation. Saved-order view with reference, recorded date, status progress list, quantity, saved total, tracking and the note "This page does not process payment". Unavailable, missing and denied states. Five owner metric slots and an orders table. | `GET /api/orders/:id` (planned, Member 3) is called by `src/lib/order-client.ts`. `GET /api/orders` (Member 3) and `GET /api/metrics` (Member 5) are planned. | Honest unavailable states. No fabricated confirmation. | All three read endpoints are missing, so the screens cannot show saved orders or metrics yet. |

### 2.2 Design rationale and metrics — approved by Member 2 (8 November 2026)

> **Review note:** This table was prepared as a proposed explanation, then reviewed and approved by Member 2 on 8 November 2026. Preparation assistance is disclosed in `AI-USAGE.md`. The metrics named below are **not instrumented**: the application has no analytics code and no measured values.

| Stage | Design rationale (why these elements suit this stage and customer) | Business metric influenced (not yet measured) |
| --- | --- | --- |
| **Browse** | Collectors and serious players compare instruments on authenticity before aesthetics. The verification badge and score therefore sit on every card, and the Verification filter is a first-class control (GC1 p. 4, feature 2). Peso price bands reflect the high-value catalog (GC1 p. 3). The "Model reference photo" label stops a sample image being mistaken for evidence, which fits a customer whose "primary friction is fear" (p. 1). Buyers of vintage instruments often search for a specific make or model. Autocomplete suggests only instruments that exist in the catalog and can open a detail page directly, shortening the route from Browse to Select. Verification details are left to the cards and detail page rather than repeated in suggestions. | Browse-to-detail click-through rate. Search-suggestion selection rate. Share of sessions using the Verification filter. Zero-result search rate. |
| **Select** | A high-value purchase needs inspection detail before commitment. The detail page therefore shows verification documentation, condition notes and seller identity on the same page as the price. Explicit copy that the cart does not reserve stock or take payment avoids false purchasing confidence. Stock-capped quantities prevent selections that cannot be fulfilled. | Detail-to-cart rate (add-to-cart actions ÷ detail views). Cart abandonment rate. |
| **Confirm** | A multi-step wizard follows the GC1 checkout design (p. 5) and keeps each step short. Inline, per-step validation is intended to reduce error-driven drop-off. Re-checking price and stock before review protects trust when listings are often one-of-one (seed stock = 1). A disabled, explained "Place order" control avoids implying a transaction the backend cannot complete. | Checkout step completion rate. Checkout abandonment by step. |
| **Save** | The confirmation screen is designed to show only server-saved data (reference, saved total, status), giving the buyer verifiable proof once `GET /api/orders/:id` exists. Showing escrow-stage labels without implying payment keeps the screen accurate until escrow exists (Final Project). | Order conversion rate (saved orders ÷ checkout starts). Feeds the owner metrics Total orders, Total revenue and Average order value (§4). |

---

## 3. Owner-stated business rules, revenue features and conclusions — Member 4

Member 4 scope: The selected GC2 features use GC1's 8% commission and verification service. PRs #40–#42 are open and unmerged. The automated and read-only catalog checks below are real; database migration, deployed order evidence and human review remain pending. Member 3 PR #37 now uses Member 4's pricing contract. The remaining migration overlap concerns guest checkout (§3.4).

### 3.1 Five owner-stated business rules

| # | Exact rule as stated by the owner | Where enforced (server/DB) | Evidence |
| --- | --- | --- | --- |
| 1 | Use the current catalog price. Never trust a total sent by the browser. | `pricingQuoteSchema` strips unknown money fields; `quoteCatalogPricing` reads `products.price`; `place_catalog_order` rejects `PRICE_CHANGED`. | `tests/pricing-validation.test.ts` and `tests/pricing-catalog.test.ts`; the read-only live quote ignored `"total": 1`. |
| 2 | ToneVault keeps 8% of the guitar subtotal from the seller. | `ACTIVE_PRICING_RULES.commissionRateBps = 800`; `calculateOrderPricing`; RPC snapshot equation and database constraint. | `tests/pricing.test.ts` verifies ₱13,440 commission on ₱168,000 and ₱15,600 on ₱195,000. |
| 3 | Verification is optional: none costs ₱0, remote costs ₱2,800, and physical costs ₱8,500. Charge the selected fee once per order, not once per item. | `VERIFICATION_OPTIONS`, `ACTIVE_PRICING_RULES.verificationFeeCentavos`, and `pricingQuoteSchema`. | Calculator test verifies a two-item order still adds the remote fee only once; validation accepts only the three named options. |
| 4 | Save the price and revenue breakdown with the order so later rule changes do not rewrite old sales. | Migration fields: `unit_price`, `subtotal_amount`, `verification_option`, `verification_fee`, `commission_rate_bps`, `commission_amount`, `seller_payout_amount`, `platform_revenue_amount`, and `total_amount`. | `tests/revenue-migration.test.ts` and `tests/pricing-types.test.ts`. Historical rows are backfilled as zero-commission snapshots. |
| 5 | Check stock and the pricing snapshot again when saving; save the order and reduce stock in one transaction. | The service-role-only `place_catalog_order` locks the product `FOR UPDATE`, validates the equations, inserts the order, and updates stock inside one Postgres function. | Migration contract test checks the lock, validation errors, insert/update statements, `SECURITY INVOKER`, revokes, and service-role grant. |

### 3.2 Two revenue features with worked examples

Each example separates the amount paid by the buyer, the seller payout, and ToneVault's recorded revenue. The "actual" values below are from the automated calculator run, not a deployed order or real payment.

| Field | Revenue feature 1 | Revenue feature 2 |
| --- | --- | --- |
| Agreed rule | 8% seller marketplace commission; no buyer add-on selected. | Optional physical verification adds ₱8,500 once; the seller commission remains 8% of the guitar subtotal only. |
| Real test inputs | PRS Custom 24, catalog price ₱168,000, quantity 1, verification `none`. | Gibson ES-335, catalog price ₱195,000, quantity 1, verification `physical`. |
| Server/DB calculation | Subtotal ₱168,000 × 8% = ₱13,440 commission. Seller payout = ₱168,000 − ₱13,440 = ₱154,560. | Commission = ₱195,000 × 8% = ₱15,600. Buyer total = ₱195,000 + ₱8,500 = ₱203,500. Seller payout = ₱179,400. Platform revenue snapshot = ₱15,600 + ₱8,500 = ₱24,100. |
| Expected total | Buyer ₱168,000; seller ₱154,560; ToneVault ₱13,440. | Buyer ₱203,500; seller ₱179,400; ToneVault ₱24,100. |
| Actual total | Automated result matched: buyer ₱168,000; seller ₱154,560; ToneVault ₱13,440. | Automated result matched: buyer ₱203,500; seller ₱179,400; ToneVault ₱24,100. |
| Endpoint/test evidence | `tests/pricing.test.ts` case "calculates the PRS 8% commission"; PR #40 verification reports 5/5 tests. | `tests/pricing.test.ts` case "adds physical verification once"; a separate live read-only quote proved the endpoint uses catalog price and ignores a browser total. No order row was written. |
| Student explanation | ToneVault earns only when a guitar sale is recorded, so its revenue grows with successful marketplace activity. The buyer still pays the listed guitar price when no add-on is chosen. | The add-on earns extra revenue from ToneVault's trust service while remaining optional. The seller commission is still based only on the instrument price, so the verification fee is not charged twice. |

### 3.3 Business conclusions

The 8% commission supports the marketplace model because ToneVault earns more when it helps complete higher-value guitar sales. The verification add-on supports the value proposition because buyers may pay for more confidence before purchasing. Keeping the add-on optional avoids raising every buyer's total.

GC2 stores a transparent snapshot instead of processing money. Therefore these amounts are **simulated or projected revenue**, not cash received. Actual earned-revenue reporting still needs the group's agreed escrow/status rule and Member 5's metrics work.

### 3.4 Member 3 pricing coordination

At the reviewed commit 3f2cd23, Member 3 PR #37 uses Member 4's pricing contract. placeCheckoutOrder calls quoteCatalogPricing, and place_checkout_order calls the 12-argument place_catalog_order. The earlier checkout_pricing_rules and order_pricing definitions and three-argument RPC call are no longer present.

The remaining overlap is in the migrations: #37 re-creates place_catalog_order to allow a null buyer_id for guest checkout. Coordinate the migration order with Member 3 so the final function preserves both Member 4's pricing validation and snapshot storage and Member 3's guest-checkout support.

ACTIVE_PRICING_RULES remains the single source for commission and verification fees. After applying the coordinated migrations to a test database, verify that guest checkout saves the server-calculated pricing snapshot and reduces stock in the same transaction. This integration test remains pending.

---

## 4. Dashboard metric decisions — Member 5

> **Handoff: pending Member 5.** One business decision is required for each dashboard metric. The five metric labels are taken from `/owner` (`app/owner/page.tsx`). Their data source, `GET /api/metrics`, is not implemented, so no metric values exist.

| Dashboard metric | Observed value (saved-data evidence) | Business decision | Rationale |
| --- | --- | --- | --- |
| Total orders | Pending — Member 5 | Pending — Member 5 | Pending — Member 5 |
| Total revenue | Pending — Member 5 | Pending — Member 5 | Pending — Member 5 |
| Average order value | Pending — Member 5 | Pending — Member 5 | Pending — Member 5 |
| Top-selling instrument | Pending — Member 5 | Pending — Member 5 | Pending — Member 5 |
| Low-stock instruments | Pending — Member 5 | Pending — Member 5 | Pending — Member 5 |
