# Member 3 checkout integration

Checkout PR #38 depends on `g2/m3-order-backend` (#37). The route is `/checkout`; it uses the existing cart context, submits guest orders by default, with optional sign-in/registration through the existing Supabase client. Optional `?product=<id>` selects a product already in the cart. Contact/shipping and simulated payment fields are validated by the backend. Pricing preview loads `/api/checkout/pricing`; the database calculates final prices.

The separate Confirmation PR supplies `/orders/:id`, the successful submission destination. Merge the whole reviewed stack before deploying a public end-to-end flow.

Member 2's unmerged UI PR #29 also defines `/checkout`, and their latest cart context may have different quantity/readiness APIs. This PR is based on current main's cart shape. It does not replace or edit their code. Before merging both workstreams, the team must select the customer UI and wire it to the guest-or-account backend contract rather than retain two competing page definitions. A multi-product cart is not submitted as a pretend atomic multi-order batch.

Actual Supabase sign-up, email confirmation, buyer sessions and mobile/browser checkout remain unverified; test with an authorized non-production account after reviewed migrations are applied. Payments are simulated and no credentials belong in source.

GC2 revision (November 9): customer login is optional. The default flow sends customer/shipping fields without a token and receives a private order-specific confirmation cookie. Optional account UI is loaded only when requested; guests do not need Supabase Auth or a public Auth key to complete checkout. Signed-in requests still send a verified buyer token. The new additive optional-buyer migration must be reviewed/applied too. Owner-screen authentication is a separate Member 5 responsibility.
