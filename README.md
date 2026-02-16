# CheapShip - Logistics & Shipping Management Platform

CheapShip is a comprehensive full-stack platform designed to simplify shipping and logistics management. It provides a seamless experience for users to calculate rates, manage orders, and grow through a dedicated franchise network, while providing administrators with powerful tools to oversee the entire ecosystem.

## 🚀 Features

### For Users
- **Smart Rate Calculator:** Instant shipping rate comparisons across different courier partners using the Shiprocket API.
- **Order Management:** Easy order creation with a step-by-step process, including address selection from a saved address book.
- **Franchise Network:** A robust referral system where users can invite others and earn commissions on their shipments.
- **Integrated Wallet:** Secure wallet for managing shipping credits, viewing transaction history, and handling payouts.
- **Address Book:** Save frequently used pickup and delivery locations for faster checkout.

### For Administrators
- **Comprehensive Dashboard:** Real-time overview of system performance, orders, and users.
- **User Management:** Control over user accounts, including status toggling and profile management.
- **Transaction Oversight:** Monitor all financial movements within the system.
- **Franchise Administration:** Manage commission rates and process withdrawal requests.
- **System Settings:** Global configuration for platform-wide parameters.

## 🛠 Tech Stack

### Frontend (`/client`)
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand & React Query
- **UI Components:** Shadcn UI (Radix UI + Base UI)
- **Icons:** Hugeicons

### Backend (`/server`)
- **Runtime:** Node.js
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** JWT with BcryptJS
- **Integrations:** Shiprocket API (Logistics), Razorpay (Payments)

## 📦 Project Structure

```
cheapship/
├── client/             # Next.js frontend application
│   ├── app/            # App router pages and layouts
│   ├── components/     # Reusable UI components
│   ├── lib/            # Utilities, hooks, and stores
│   └── public/         # Static assets
└── server/             # Express.js backend API
    ├── controllers/    # Request handlers
    ├── middleware/     # Custom Express middlewares
    ├── prisma/         # Database schema and migrations
    ├── routes/         # API route definitions
    └── utils/          # Helper functions and API clients
```

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- pnpm (recommended)

### Backend Setup
1. Navigate to the server directory: `cd server`
2. Install dependencies: `pnpm install`
3. Create a `.env` file based on `.env.example` (if available) and configure your database and API keys.
4. Run Prisma migrations: `npx prisma migrate dev`
5. Start the server: `npm start`
6. Access API documentation: `http://localhost:3001/api-docs` (assuming default port)

### Frontend Setup
1. Navigate to the client directory: `cd client`
2. Install dependencies: `pnpm install`
3. Create a `.env.local` file and set `NEXT_PUBLIC_API_URL`.
4. Build the project: `pnpm build`
5. Start the development server: `pnpm dev`

## 📝 License

This project is private and intended for internal use.
