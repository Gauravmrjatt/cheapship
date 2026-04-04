# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CheapShip is a logistics/shipping management platform with a Next.js frontend and Express.js backend. It lets users compare courier rates, book shipments, manage orders, and participate in a franchise/referral network. External APIs: Shiprocket (shipping/couriers), Razorpay (payments), Firebase (SMS OTP).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Shadcn UI, Zustand, React Query, Firebase |
| Backend | Express.js (Node.js), JavaScript, Prisma ORM, PostgreSQL |
| Auth | JWT + Bcrypt, OTP (email + Firebase SMS) |
| Payments | Razorpay |
| Shipping | Shiprocket + Vyom (via courier_configurations) |
| API Docs | Swagger UI at `/api-docs` |

## Common Commands

**Server:**
```bash
cd server
pnpm install
cp .env.example .env                  # fill in DB, keys, secrets
npx prisma migrate dev               # run migrations
npm start                            # start server (port 3001)
```

**Client:**
```bash
cd client
pnpm install
cp .env.example .env.local           # set NEXT_PUBLIC_API_URL (to http://localhost:3001)
pnpm dev                             # dev server (port 3000)
pnpm build                           # production build
pnpm lint                            # ESLint
```

## Architecture

### Server (`server/`)

- **`app.js`** — Express entry point. Mounts middleware, routes at `/api/v1`, Swagger at `/api-docs`, health at `/health`.
- **`middleware/`** — `auth.middleware.js` (JWT verification), `admin.middleware.js` (admin role check — makes extra DB query per request).
- **`routes/`** — Route files define endpoints. Notable: `v1.route.js` is the router mounting all sub-routes. `/api/v1/test-db` and `/api/v1/user-token` are **currently unauthenticated** — see Security section below.
- **`controllers/`** — Request handlers. Most are wrapped by `authMiddleware`. Key controllers: `auth.controller.js`, `order.controller.js`, `transaction.controller.js`, `admin.controller.js`, `franchise.controller.js`, `dispute.controller.js`.
- **`services/`** — OTP service, email service, Firebase service.
- **`prisma/schema.prisma`** — Single source of truth for the DB schema. Models: User, Order, Transaction, Address, CommissionWithdrawal, WalletPlan, WeightDispute, RTODispute, Feedback, OtpVerification, TempRegistrationData, CourierConfiguration, SystemSetting.
- **`utils/`** — Shiprocket API wrapper, Razorpay wrapper, Firebase admin, Prisma client, Vyom API, referral commissions, label customization, order ID generator.
- **`swagger.js`** — Swagger/OpenAPI auto-generated from controller JSDoc.

### Client (`client/`)

- **`app/`** — Next.js App Router. Key route groups: `/auth` (login/signup), `/dashboard` (user), `/admin` (admin panel).
- **`components/`** — Reusable UI components, Shadcn-based.
- **`lib/`** — Custom hooks, Zustand stores, utility functions.
- **State** — Zustand for UI state, React Query for server data fetching.

### Key API Route Pattern

All user-facing routes under `/api/v1/*` require a JWT Bearer token. Admin routes add `adminMiddleware` which checks `user_type === 'ADMIN'`. The order webhook (`POST /orders/webhook`) is intentionally public.

### Transaction/Wallet Security Notes

- The webhook endpoint (`POST /api/v1/orders/webhook`) has **no signature verification** — Shiprocket payloads are processed directly. This is a known security issue.
- Withdrawal flow: `franchise.controller.withdrawCommission` debits wallet immediately on request creation. `admin.controller.processWithdrawal` releases refund on REJECT, just records transaction on APPROVE.
- Razorpay payment verification validates signature (HMAC-SHA256), fetches the order/payment from Razorpay to confirm amount and status, and checks for duplicate payment_id. All within a `$transaction`.

### Important Patterns

- All controllers access Prisma via `req.app.locals.prisma`.
- Wallet deductions/credits must always occur inside `prisma.$transaction`.
- Order IDs are BigInt, not string UUIDs.
- KYC must be VERIFIED before creating non-draft orders.
- Commission calculations happen in `order.controller.calculateFinalRates` — don't trust client-provided shipping_charge; always recalculate server-side (already done).
