# Dodo Tiny Checkout

A lightweight, embeddable checkout SDK and isolated checkout application built for Dodo Payments. It enables merchants to drop a single script onto their site, invoke a clean JavaScript API, and display an isolated, secure checkout modal without redirecting users away.

---

## 1. Architecture Overview

The project is structured as an npm monorepo separating three distinct concerns:

```
Merchant Website (apps/demo: 5173)
       │
       │  DodoCheckout.open({ productId, onSuccess, onClose, onError })
       ▼
  SDK Package (packages/sdk)
       │
       │  Mounts backdrop + creates sandboxed iframe pointing to checkout origin
       ▼
Checkout App (apps/checkout: 5174)
       │
       │  Card input formatting, brand detection & simulated payment state machine
       │  window.parent.postMessage({ type: 'DODO_PAYMENT_SUCCESS', sessionId }, targetOrigin)
       ▼
  SDK Package (packages/sdk)
       │  1. Validates event.origin against checkout origin
       │  2. Validates event.source matches iframe.contentWindow
       │  3. Validates message schema (DODO_*)
       │  4. Dispatches high-level callbacks
       ▼
Merchant Callbacks (onSuccess, onError, onClose)
```

### Directory Structure

```
dodo-checkout/
├── packages/
│   └── sdk/                # Zero-dependency, framework-agnostic TypeScript SDK
│       ├── src/
│       │   ├── index.ts    # DodoCheckout singleton & public API
│       │   ├── modal.ts    # DOM creation, iframe lifecycle & focus trap
│       │   ├── messenger.ts# Strict origin/source postMessage validator
│       │   └── types.ts    # Public & protocol type definitions
│       └── src/sdk.test.ts # Vitest suite for SDK & security boundary
├── apps/
│   ├── checkout/           # Isolated React checkout app rendered inside the iframe
│   │   ├── src/
│   │   │   ├── components/ # CardForm, TestCardPills, ProductSummary
│   │   │   ├── services/   # Payment engine, test cards & product catalog
│   │   │   └── styles/     # Restrained, trustworthy design system
│   │   └── vite.config.ts  # Runs on http://localhost:5174
│   └── demo/               # Merchant showcase store with live callback activity log
│       ├── src/
│       │   ├── App.tsx     # Merchant product tiers & SDK integration
│       │   └── styles/     # Modern developer SaaS aesthetic
│       └── vite.config.ts  # Runs on http://localhost:5173
├── package.json
└── README.md
```

---

## 2. Running Locally

### Prerequisites
- Node.js 18+ (tested on Node v20.19.0)
- npm 9+

### Quick Start

1. **Install dependencies across the monorepo**:
   ```bash
   npm install
   ```

2. **Run both dev servers concurrently**:
   ```bash
   npm run dev
   ```
   This launches:
   - **Merchant Demo Store**: [http://localhost:5173](http://localhost:5173)
   - **Isolated Checkout App**: [http://localhost:5174](http://localhost:5174)

3. **Run automated test suite**:
   ```bash
   npm test
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## 3. SDK API

The SDK API is intentionally small, predictable, and free of unnecessary configuration:

```typescript
import { DodoCheckout } from "@dodo/sdk";

// Open the checkout modal
DodoCheckout.open({
  productId: "prod_123",

  // Optional: override checkout host in custom environments
  // checkoutUrl: "https://checkout.dodopayments.com",

  onSuccess: ({ sessionId }) => {
    console.log("Payment successful! Session:", sessionId);
  },

  onError: ({ code, message }) => {
    console.error("Payment failed:", code, message);
  },

  onClose: ({ reason }) => {
    console.log("Checkout modal dismissed:", reason);
  },
});

// Programmatically close if required
DodoCheckout.close();
```

### Stable Error Codes
- `CARD_DECLINED`: The card was declined by the issuer.
- `PAYMENT_FAILED`: Processing error / transient failure.
- `PRODUCT_NOT_FOUND`: The requested `productId` does not exist.
- `CHECKOUT_LOAD_FAILED`: Iframe network error or handshake timeout.
- `COMMUNICATION_ERROR`: Unexpected communication breakdown.

---

## 4. Communication & Security Boundary

### Strict Security Isolation
1. **Isolated Context**: The checkout application runs in its own iframe origin (`http://localhost:5174`), isolated from the merchant host page (`http://localhost:5173`).
2. **Card Data Never Leaves the Iframe**: Full card numbers, CVC, expiry dates, and form state are strictly confined to the iframe memory. The parent merchant window cannot query, intercept, or log sensitive cardholder data.
3. **High-Level Events Only**: The host merchant page only receives sanitized, high-level status payloads:
   - `{ type: "DODO_PAYMENT_SUCCESS", sessionId: "sess_demo_..." }`
   - `{ type: "DODO_PAYMENT_ERROR", code: "CARD_DECLINED", message: "..." }`
   - `{ type: "DODO_CHECKOUT_CLOSE", reason: "user_closed" | "completed" }`
4. **PostMessage Security Strategy**:
   - **Origin Check**: Messages are validated against the expected checkout origin (`event.origin === expectedOrigin`). Rogue origins are dropped immediately.
   - **Source Window Check**: Messages are verified to originate strictly from `activeIframe.contentWindow` (`event.source === iframeWindow`).
   - **Schema Check**: Non-Dodo messages (e.g. browser extensions, HMR) are cleanly ignored.
5. **No Card Data in URLs or LocalStorage**: Card details are never persisted to `localStorage`, `sessionStorage`, cookies, or URL query parameters.

> **PCI Compliance Note**: While this iframe model mirrors production security architectures (like Stripe Elements or Dodo Checkout), this is a demonstration environment and does not constitute full PCI-DSS Level 1 certification.

---

## 5. Test Payment Cards & State Simulator

The embedded checkout includes built-in simulation for test scenarios (with one-click pill buttons in the checkout for rapid reviewer testing):

| Test Card Number | Expiry | CVC | Expected Behavior |
| :--- | :--- | :--- | :--- |
| `4242 4242 4242 4242` | `12/28` | `123` | **Immediate Success**: Generates dynamic `sess_demo_<id>` and fires `onSuccess`. |
| `4000 0000 0000 0002` | `12/28` | `456` | **Card Declined**: Shows "Payment declined: Your card was declined. No money was charged." Allows instant retry. |
| `4000 0000 0000 0341` | `12/28` | `789` | **Fail Once then Succeed**: Fails on 1st attempt in the session, then succeeds on retry. |

---

## 6. Edge Cases Handled

1. **Double-Clicking "Buy Now"**: The SDK implements singleton lifecycle tracking. If `DodoCheckout.open()` is invoked while a modal is already active, the duplicate call is safely ignored with a console warning.
2. **Double-Clicking "Pay"**: The Pay button is disabled and enters a spinner loading state immediately upon submission, preventing double charges.
3. **Invalid / Expired Products**: Passing an unrecognized ID (e.g. `prod_invalid_999`) shows a graceful "Product Unavailable" empty state with a single-click close action rather than a broken or blank screen.
4. **Iframe Handshake Timeout**: If the checkout app fails to load within 12 seconds, the SDK triggers `onError` with `CHECKOUT_LOAD_FAILED`.
5. **Keyboard & Escape Key**: Pressing `Escape` or clicking the backdrop dismisses the checkout and triggers `onClose({ reason: 'user_closed' })`.
6. **Closing After Success**: If the user completes payment and then closes the modal, `onClose` receives `{ reason: 'completed' }` rather than misclassifying it as a cancellation.

---

## 7. Performance & Accessibility

### Performance
- **Lazy Iframe Mount**: The checkout application is only loaded into the DOM when the merchant calls `DodoCheckout.open()`.
- **Zero-Dependency SDK**: The SDK has zero runtime dependencies and adds negligible bundle overhead (< 2.5 KB).
- **Fast Teardown**: Closing the modal instantly removes DOM elements, unbinds window event listeners, and frees memory.

### Accessibility
- **Focus Management**: Focus is captured within the modal upon open and automatically returned to the triggering merchant button upon close.
- **Form Semantics**: Complete ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-label`, `autoComplete="cc-number"`).
- **Reduced Motion**: All animations respect `@media (prefers-reduced-motion: reduce)`.
- **Contrast**: Complies with WCAG AA color contrast standards.

---

## 8. Two Decisions I Went Back and Forth On

### 1. Embedded Iframe Modal vs. Hosted Checkout Redirect (or Popup)
- **The Dilemma**: Hosted redirect pages (like Stripe Checkout hosted mode) simplify frame sizing and eliminate parent CSS conflicts. However, full redirects break user context and introduce drop-off friction. Popups often suffer from aggressive browser popup blockers.
- **The Choice**: I chose an **embedded iframe inside an SDK-managed modal**. It keeps the user seamlessly on the merchant site, guarantees a controlled security boundary where the parent window cannot read card inputs, and provides instant close transitions.

### 2. Deep Customizability (Themes / CSS Injection) vs. Strictly Controlled UI
- **The Dilemma**: Merchants often want full control over checkout fonts, colors, and margins. However, allowing merchants to inject arbitrary CSS into the checkout iframe risks breaking form usability, hiding security badges, or compromising clickjacking defenses.
- **The Choice**: I opted for a **strictly controlled, high-trust design system** with a restrained, neutral palette that blends cleanly with any modern website. In production, customizability should be limited to safe theme tokens (accent color, corner radius) passed via secure initialization configs rather than arbitrary stylesheet injection.

---

## 9. What I'd Explore Next in Production

1. **Tokenization API & PCI Boundary**: Implement real tokenization where raw card data is swapped for single-use payment method tokens (`pm_tok_...`) directly against Dodo payment vaults before notifying the merchant.
2. **Server-Side Verification & Webhooks**: Merchant callbacks are great for UI updates, but backend fulfillment should always rely on cryptographically signed server webhooks (`checkout.session.completed`).
3. **Strict Content Security Policy (CSP)**: Configure `frame-ancestors 'self' https://*.merchant.com` headers to prevent unauthorized domains from embedding the checkout.
4. **Idempotency Keys**: Attach client-generated UUID idempotency keys to each payment attempt to prevent accidental double-billing in erratic network conditions.
5. **Dynamic Localization & Currency Formatting**: Detect user locale and format pricing, tax calculation, and language dynamically.
