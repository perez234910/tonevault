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
| **Monetization** | Hybrid model: "8% Marketplace Commission", charged "to sellers for every completed guitar sale"; verification fees; Pro Seller Subscription at "Approximately ₱1,650 per month"; and sponsored listings, where "Any seller may pay to increase the visibility of a listing" (pp. 3–4, *Monetization Models*). | No revenue stream appears in code. `place_catalog_order` (`supabase/migrations/20241108003000_order_quantity_and_stock.sql`) stores `total_amount = price × quantity` and has no commission, fee or subscription fields. The `/checkout` summary lists "Shipping / fees" as "Not calculated". | None yet. The server-side total calculation is the point where a revenue rule could be enforced. | **Not implemented.** Member 4 owns the choice and implementation of the two GC2 revenue features (§3). |
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

> **Handoff: pending Member 4.** No content has been supplied. Do not fill these fields with assumed rules, fees, discounts or outcomes. GC1 monetization options for reference only: the commission, verification fee, subscription and sponsored listing streams in §1.1. The choice is Member 4's. An earlier version of this file listed the owner rules under Member 5. Per the current team allocation they belong to Member 4, and Member 5 owns the metric decisions in §4.

### 3.1 Five owner-stated business rules

| # | Exact rule as stated by the owner | Where enforced (server/DB) | Evidence |
| --- | --- | --- | --- |
| 1 | Pending — Member 4 | Pending | Pending |
| 2 | Pending — Member 4 | Pending | Pending |
| 3 | Pending — Member 4 | Pending | Pending |
| 4 | Pending — Member 4 | Pending | Pending |
| 5 | Pending — Member 4 | Pending | Pending |

### 3.2 Two revenue features with worked examples

Each example requires: **agreed rule, real test inputs, server/DB calculation, expected total, actual total, endpoint/test evidence, student explanation**. Both remain pending. Do not invent discounts, fees, outcomes or reasoning before the team chooses and implements the two rules.

| Field | Revenue feature 1 | Revenue feature 2 |
| --- | --- | --- |
| Agreed rule | Pending — Member 4 | Pending — Member 4 |
| Real test inputs | Pending | Pending |
| Server/DB calculation | Pending | Pending |
| Expected total | Pending | Pending |
| Actual total | Pending | Pending |
| Endpoint/test evidence | Pending | Pending |
| Student explanation | Pending | Pending |

### 3.3 Business conclusions

Pending — Member 4.

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
