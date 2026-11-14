# ToneVault GC2 Business Summary

## What we built

ToneVault is a marketplace prototype for premium pre-owned and vintage guitars. Its GC2 flow combines catalog browsing, verification details, a stock-aware cart, simulated checkout, and server-saved orders. Member 4 added two GC1 revenue features: an 8% seller marketplace commission and an optional verification service (none, ₱2,800 remote, or ₱8,500 physical).

The server owns pricing. It reads the current catalog price, ignores any total typed by the browser, calculates with integer centavos, and saves a complete pricing snapshot with the order. The database locks the product, checks stock and price again, then saves the order and reduces stock in one transaction.

## How the features support the business model

### 1. Marketplace commission

ToneVault keeps 8% of the guitar subtotal from the seller. This supports a marketplace model because revenue grows when ToneVault helps complete more sales and higher-value sales. The buyer pays the listed guitar price when no verification add-on is chosen.

### 2. Verification add-on

Buyers may choose no add-on, remote verification for ₱2,800, or physical verification for ₱8,500. The fee is added once per order. This supports ToneVault's trust promise by monetizing verification while keeping it optional for buyers who do not need another inspection.

## Worked numbers

### Commission example

PRS Custom 24: ₱168,000 x 8% = ₱13,440 commission.

- Buyer total: ₱168,000
- Seller payout: ₱168,000 - ₱13,440 = ₱154,560
- ToneVault revenue snapshot: ₱13,440

Conclusion: ToneVault earns only when the marketplace records a sale, aligning revenue with successful transactions.

### Verification example

Gibson ES-335: ₱195,000 plus ₱8,500 physical verification.

- Buyer total: ₱195,000 + ₱8,500 = ₱203,500
- Commission: ₱195,000 x 8% = ₱15,600
- Seller payout: ₱195,000 - ₱15,600 = ₱179,400
- ToneVault revenue snapshot: ₱15,600 + ₱8,500 = ₱24,100

Conclusion: verification adds ₱8,500 of revenue while directly supporting the platform's trust value.

## Implementation and evidence

- One active rules file owns the commission and verification values.
- The quote endpoint returns server-calculated unit price, subtotal, fee, commission, seller payout, platform revenue, and total.
- The order migration stores those fields as a historical snapshot and restricts the RPC to the server service role.
- Automated result: 17 tests passed; typecheck, changed-file lint, and production build passed.
- A read-only live catalog quote ignored a browser-supplied `total: 1` and returned the server result.

## Limits and next decision

GC2 simulates payment. Saved amounts are projected revenue, not proof of cash received. The migration is not yet applied to the shared database, the pricing PRs are unmerged, and no deployed order evidence is claimed. Member 3 PR #37 contains a duplicate pricing structure; reviewers must keep Member 4's rules as the single source and adapt Member 3's authentication/contact flow to the new order contract before merging.
