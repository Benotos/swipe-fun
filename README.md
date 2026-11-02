# SWIPE.FUN

SWIPE.FUN is a Next.js 14 storefront prototype for purchasing digital gift cards with SOL. The landing page, catalog, quote display, checkout UI, order page, stock counter, Redis persistence layer and protected order-cleanup cron are in place.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Current operating mode

**Checkout is deliberately in demo mode. Do not send SOL to an order address.**

The payment adapter returns a non-payable demo identifier. The gift card adapter does not issue redeemable codes. These safeguards remain until the project owners select the deposit custody model and gift-card supplier, provide credentials securely, and the corresponding provider adapters are implemented and tested.

The catalog and SOL quote are illustrative storefront functionality. The listed brands and denominations must be confirmed with the selected fulfilment provider before launch.

## Production infrastructure setup

1. Create an Upstash Redis database.
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel for Production, Preview and Development.
3. Generate a long random `CRON_SECRET` and add it to the same Vercel environments.
4. Redeploy after setting the variables.
5. Verify `GET /api/stock` returns a database source and that a demo order persists after a page refresh.
6. Verify the protected cron route rejects requests without the bearer secret and expires stale demo orders when called with it.

The Redis inventory reservation uses a Lua script so the 500 item cap is checked and reserved atomically. Expiry releases a reservation once, preventing repeated polling from decrementing stock multiple times. The in-memory fallback is development-only and must not be used for production.

## Provider integration still required

### Solana payments

The project owners must select who controls deposit addresses and private keys. A single static public wallet is not sufficient for safely attributing concurrent orders. Choose a custody or payment provider that can issue unique deposit addresses, or approve a secure server-side derivation design with encrypted key custody.

Implement the `PaymentProvider` interface in `src/lib/providers/payment.ts` to:
- create a unique deposit address for each order;
- monitor the exact expected SOL amount and the required confirmation level;
- reject underpayments, overpayments, late transfers and duplicate transaction processing;
- return a transaction reference and make confirmation idempotent.

Private keys, seed phrases, API secrets and signing material must never be sent to the browser or committed to GitHub.

### Gift card fulfilment

Choose a supplier that supports the required brands, regions and denominations. Confirm stock, fees, delivery guarantees, refund handling and whether the codes are redeemable in the intended country.

Implement `GiftCardProvider` in `src/lib/providers/gift-cards.ts`. Fulfilment must be idempotent using the SWIPE order ID as the provider reference. Do not mark an order delivered until the supplier confirms a successful code delivery.

### Before enabling live checkout

- Add the selected provider's server-side credentials to Vercel, never to `NEXT_PUBLIC_*` variables.
- Implement webhook signature verification or authenticated polling.
- Persist transaction signatures and provider fulfilment references.
- Add retry-safe fulfilment, failure handling and a documented refund/reconciliation process.
- Add rate limiting and abuse protection to public order creation.
- Test successful, underpaid, overpaid, duplicate, late and failed payments in a provider sandbox.
- Test supplier timeouts, duplicate fulfilment requests and out-of-stock responses.
- Have the project owners approve custody, fees, refund policy, token utility wording and launch terms.

## Routes

- `/` landing page and Genesis counter
- `/checkout` catalog selection and demo checkout
- `/order/[id]` bookmarkable order status
- `GET /api/catalog` live SOL/USD quote and catalog
- `GET /api/stock` inventory totals
- `POST /api/orders` creates a demo order and reserves one Genesis spot
- `GET /api/orders/[id]` retrieves order status and expires stale orders
- `GET /api/cron/watch-payments` protected cleanup endpoint for expired orders

## Scheduled cleanup

Vercel Cron calls `/api/cron/watch-payments` every five minutes. Configure `CRON_SECRET` in Vercel. This job only expires stale demo orders; it does not monitor Solana payments until a real payment provider is integrated.

## Important

The site is integration-ready, not payment-live. Keep the demo warning visible until both payment detection and real gift card delivery have passed end-to-end tests.
