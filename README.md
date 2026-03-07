# CheapShip — Logistics & Shipping Management Platform

CheapShip is a comprehensive full-stack platform designed to simplify shipping and logistics management. It provides a seamless experience for users to calculate rates, manage orders, and grow through a dedicated franchise network, while giving administrators powerful tools to oversee the entire ecosystem.

---

## 🗺️ System Architecture

```mermaid
flowchart TD
    subgraph CLIENT["🖥️ Client — Next.js 16 (App Router)"]
        UI["Pages & Components\n(Shadcn UI / Tailwind CSS 4)"]
        Store["State\n(Zustand + React Query)"]
        UI <--> Store
    end

    subgraph SERVER["⚙️ Server — Express.js (Node.js)"]
        direction TB
        MW["Middleware\n(JWT Auth · Helmet · CORS)"]
        R_AUTH["POST /api/v1/auth\n(register · login · OTP · KYC)"]
        R_ORD["GET/POST /api/v1/orders\n(create · track · cancel · label)"]
        R_FRAN["GET/POST /api/v1/franchise\n(join · referral · commission · payouts)"]
        R_ADDR["GET/POST /api/v1/addresses\n(address book CRUD)"]
        R_TXN["GET /api/v1/transactions\n(wallet history · debits · credits)"]
        R_DASH["GET /api/v1/dashboard\n(stats · analytics)"]
        R_ADMIN["GET/POST /api/v1/admin\n(users · settings · withdrawals)"]
        MW --> R_AUTH & R_ORD & R_FRAN & R_ADDR & R_TXN & R_DASH & R_ADMIN
    end

    subgraph DB["🗄️ PostgreSQL + Prisma ORM"]
        T_USER["Users & KYC"]
        T_ORD["Orders"]
        T_FRAN["Franchise & Commissions"]
        T_WALLET["Wallet & Transactions"]
        T_ADDR["Addresses"]
    end

    subgraph EXT["🌐 External Services"]
        SHIPROCKET["Shiprocket API\n(rates · booking · tracking)"]
        RAZORPAY["Razorpay\n(wallet top-up · payouts)"]
    end

    Store -- "HTTPS REST" --> MW
    R_AUTH & R_ADDR --> T_USER & T_ADDR
    R_ORD --> T_ORD
    R_ORD -->|"rate check / book / track"| SHIPROCKET
    R_FRAN --> T_FRAN
    R_TXN --> T_WALLET
    R_DASH --> T_USER & T_ORD & T_WALLET
    R_ADMIN --> T_USER & T_FRAN & T_WALLET
    R_TXN -->|"payment gateway"| RAZORPAY
```

---

## 🔄 Core User Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js Client
    participant BE as Express API
    participant SR as Shiprocket
    participant DB as PostgreSQL
    participant RZ as Razorpay

    User->>FE: Register / Login
    FE->>BE: POST /api/v1/auth/register|login
    BE->>DB: Create / verify user (bcrypt + JWT)
    BE-->>FE: JWT token

    User->>FE: Add wallet balance
    FE->>BE: POST /api/v1/transactions/topup
    BE->>RZ: Create payment order
    RZ-->>User: Payment UI
    User-->>RZ: Pay
    RZ->>BE: Webhook (payment captured)
    BE->>DB: Credit wallet

    User->>FE: Calculate shipping rates
    FE->>BE: GET /api/v1/orders/rates
    BE->>SR: Fetch courier rates
    SR-->>BE: Rate list
    BE-->>FE: Sorted cheapest rates

    User->>FE: Place order
    FE->>BE: POST /api/v1/orders
    BE->>SR: Book shipment
    SR-->>BE: AWB / label URL
    BE->>DB: Save order + debit wallet
    BE-->>FE: Order confirmed

    User->>FE: Track shipment
    FE->>BE: GET /api/v1/orders/:id/track
    BE->>SR: Live tracking
    SR-->>BE: Status
    BE-->>FE: Tracking timeline
```

---

## 🏗️ Franchise & Commission Flow

```mermaid
flowchart LR
    A["User A\n(Franchisee)"] -->|"Shares referral link"| B["User B signs up\nunder User A"]
    B -->|"Places shipments"| C["Order Revenue"]
    C -->|"% commission"| D["User A's Wallet"]
    D -->|"Withdrawal request"| E["Admin reviews & approves"]
    E -->|"Payout via Razorpay"| A
```

---

## 🚀 Features!

### For Users
- **Smart Rate Calculator** — Instant shipping rate comparisons across courier partners via Shiprocket.
- **Order Management** — Step-by-step order creation with saved address book.
- **Franchise Network** — Referral system with commission earnings on downstream shipments.
- **Integrated Wallet** — Shipping credits, transaction history, and Razorpay-powered payouts.
- **Address Book** — Save and reuse pickup/delivery locations.

### For Administrators
- **Dashboard** — Real-time overview of platform stats, orders, and users.
- **User Management** — Account control, status toggling, and profile management.
- **Transaction Oversight** — Monitor all financial movements in the system.
- **Franchise Administration** — Set commission rates and process withdrawal requests.
- **System Settings** — Global configuration for platform-wide parameters.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **State Management** | Zustand & React Query |
| **UI Components** | Shadcn UI (Radix UI + Base UI) |
| **Icons** | Hugeicons |
| **Backend Framework** | Express.js (Node.js) |
| **ORM** | Prisma |
| **Database** | PostgreSQL |
| **Authentication** | JWT + BcryptJS |
| **Logistics API** | Shiprocket |
| **Payments** | Razorpay |
| **API Docs** | Swagger UI (`/api-docs`) |

---

## 📦 Project Structure

```
cheapship/
├── client/                  # Next.js frontend
│   ├── app/                 # App router pages & layouts
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Hooks, stores, utilities
│   └── public/              # Static assets
└── server/                  # Express.js backend
    ├── controllers/         # Request handlers
    ├── middleware/          # JWT auth, error handling
    ├── prisma/              # DB schema & migrations
    ├── routes/              # API route definitions
    ├── services/            # Business logic layer
    └── utils/               # Helpers, Prisma client, API wrappers
```

---

## 🛠 Installation & Setup

### Prerequisites
- Node.js v18+
- PostgreSQL
- pnpm (recommended)

### Backend
```bash
cd server
pnpm install
cp .env.example .env        # fill in DB URL, JWT secret, API keys
npx prisma migrate dev
npm start
# API docs → http://localhost:3001/api-docs
```

### Frontend
```bash
cd client
pnpm install
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL
pnpm dev
# App → http://localhost:3000
```

---

## 📝 License

This project is private and intended for internal use.
