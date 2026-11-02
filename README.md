# SWIPE.FUN

Next.js 14 landing page starter for the SWIPE.FUN Solana gift card project.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Inventory status

The `/api/stock` route currently returns preview inventory from environment variables. It is not a production stock system and must not be presented as live inventory.

Before launch, replace the preview values with a database backed inventory service. Reserve stock atomically when an order is created and release it if the order expires or fails.

## Current scope

- Responsive landing page
- Genesis drop counter UI
- Stock API preview endpoint
- Three step product explanation
- Token section with no unconfirmed token promises

Purchase, order delivery, deposit generation, chain monitoring and gift card fulfilment are not implemented yet.
