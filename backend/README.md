# Foodie Backend

This backend implements a Node.js + Express + Sequelize/SQLite API for the Food-Delivery-Web-App frontend.

## Features
- User auth: `POST /api/auth/register`, `POST /api/auth/login`
- Restaurant catalog: `GET /api/restaurants`, `GET /api/restaurants/:slug`
- Order management: authenticated user order creation and retrieval
- Local simulated payment initialization and verification
- Admin endpoints for restaurants, orders, and users
- Serves frontend static files from `../frontend`

## Setup
1. Copy `.env.example` to `.env`
2. Set `JWT_SECRET`
3. Run `npm install`
4. Run `npm run seed` to seed sample restaurants and an admin user
5. Start with `npm run dev`

## Notes
- The backend expects authenticated requests to include `Authorization: Bearer <token>`.
- The frontend checkout is wired to the backend demo payment API and never redirects to an external payment provider.

## Simulated payments

The checkout uses `POST /api/payments/demo`. It never contacts Paystack, OPay, a bank, a card network, or any external payment API. Each request stores a unique `DEMO-...` reference, a `DEMO / SIMULATED / ...` channel, and either `Paid` or `Failed` on the order.

Testers can enter fake details and choose either a successful or failed result. Demo references and statuses are for testing only and must never be presented as real gateway transactions.
