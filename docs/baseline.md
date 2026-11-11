# ToneVault – GC2 Performance Baseline

## 1. Test Information

- Date: November 11, 2026
- Website: https://tonevault-seven.vercel.app
- Page tested: /browse
- Device: Mac
- Browser: Google Chrome
- Test mode: Lighthouse Mobile simulation

## 2. Lighthouse Mobile Results

| Category | Score |
|---|---:|
| Performance | 95/100 |
| Accessibility | 98/100 |
| Best Practices | 96/100 |

**Note:** Lighthouse reported a browser cache-clearing timeout during this run. The scores above are the results recorded by Lighthouse for this test and should be interpreted with that limitation in mind.

**Evidence:**
- `docs/evidence/baseline/lighthouse-mobile.png`

## 3. First-Load Network Measurements

**Tool:** Chrome Developer Tools – Network

- Cache disabled: Yes
- Network throttling: No throttling
- First-load request count: 27
- Total transferred: 489 kB
- Total resources: 925 kB
- Page finish: 3.75 seconds

**Evidence:**
- `docs/evidence/baseline/network-first-load.png`

## 4. GET /api/products Response Time

- Endpoint: `https://tonevault-seven.vercel.app/api/products`
- HTTP Method: GET
- HTTP Status: 200 OK
- Total request duration: 1,170 ms (1.17 seconds)
- Waiting for server response: 1,160 ms (1.16 seconds)
- Content download: 1.64 ms

The endpoint successfully returned seven guitar listings.

**Evidence:**
- `docs/evidence/baseline/products-api-headers.png`
- `docs/evidence/baseline/products-api-timing.png`

## 5. Three Known Weaknesses

### Weakness 1: Failed Image Requests

- **Observation:** Three image-related requests returned HTTP 404 during the captured Browse page load.
- **Impact:** Some product images may fail to display.
- **Suggested improvement:** Review the affected image URLs and verify that all product images load correctly.

### Weakness 2: Simulated Payment

- **Observation:** GC2 uses simulated payment rather than actual payment processing.
- **Impact:** Buyers cannot yet complete genuine protected transactions.
- **Suggested improvement:** Implement the approved payment and escrow integration in the Final Project.

### Weakness 3: Limited Inspection Implementation

- **Observation:** Sample verification scores and images are not proof of completed physical or remote inspections.
- **Impact:** Buyers may not receive the full inspection certainty promised by ToneVault.
- **Suggested improvement:** Develop a standardized inspection and grading workflow.

## 6. Summary

The baseline records the current deployed Browse page's Lighthouse performance, accessibility, network activity, and API response time.

These measurements will serve as a reference for evaluating improvements in the Final Project.

All measurements are based on the actual testing evidence collected.