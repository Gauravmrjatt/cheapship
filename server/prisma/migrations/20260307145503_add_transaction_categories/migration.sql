-- Idempotent migration: handles both fresh DB and already-applied cases

-- Add TransactionCategory enum values if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SECURITY_DEPOSIT') THEN
        ALTER TYPE "TransactionCategory" ADD VALUE 'SECURITY_DEPOSIT';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'WEIGHT_DISPUTE') THEN
        ALTER TYPE "TransactionCategory" ADD VALUE 'WEIGHT_DISPUTE';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RTO_CHARGE') THEN
        ALTER TYPE "TransactionCategory" ADD VALUE 'RTO_CHARGE';
    END IF;
END $$;

-- Create enums if not exists (using DO block for idempotency)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PayoutStatus') THEN
        CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'COMPLETED');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupportTicketStatus') THEN
        CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DisputeStatus') THEN
        CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
    END IF;
END $$;

-- Add columns to orders if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'is_draft') THEN
        ALTER TABLE "orders" ADD COLUMN "is_draft" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'is_vyom') THEN
        ALTER TABLE "orders" ADD COLUMN "is_vyom" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payout_status') THEN
        ALTER TABLE "orders" ADD COLUMN "payout_status" "PayoutStatus" NOT NULL DEFAULT 'PENDING';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'pickup_location') THEN
        ALTER TABLE "orders" ADD COLUMN "pickup_location" VARCHAR(255);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'pickup_scheduled_date') THEN
        ALTER TABLE "orders" ADD COLUMN "pickup_scheduled_date" TIMESTAMP(6);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'vyom_order_id') THEN
        ALTER TABLE "orders" ADD COLUMN "vyom_order_id" VARCHAR(50);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'vyom_shipment_id') THEN
        ALTER TABLE "orders" ADD COLUMN "vyom_shipment_id" VARCHAR(50);
    END IF;
END $$;

-- Add columns to users if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'active_discount') THEN
        ALTER TABLE "users" ADD COLUMN "active_discount" DECIMAL(5,2) NOT NULL DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'default_referred_pickup_id') THEN
        ALTER TABLE "users" ADD COLUMN "default_referred_pickup_id" UUID;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'security_deposit') THEN
        ALTER TABLE "users" ADD COLUMN "security_deposit" DECIMAL(12,2) NOT NULL DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'upi_id') THEN
        ALTER TABLE "users" ADD COLUMN "upi_id" VARCHAR(100);
    END IF;
END $$;

-- Add closing_balance to transactions if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'closing_balance') THEN
        ALTER TABLE "transactions" ADD COLUMN "closing_balance" DECIMAL(12,2);
    END IF;
END $$;

-- Create wallet_plans table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_plans') THEN
        CREATE TABLE "wallet_plans" (
            "id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "name" VARCHAR(100) NOT NULL,
            "recharge_amount" DECIMAL(10,2) NOT NULL,
            "discount_percentage" DECIMAL(5,2) NOT NULL,
            "is_active" BOOLEAN NOT NULL DEFAULT true,
            "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "wallet_plans_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Create support_tickets table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
        CREATE TABLE "support_tickets" (
            "id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "user_id" UUID NOT NULL,
            "subject" VARCHAR(255) NOT NULL,
            "message" TEXT NOT NULL,
            "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
            "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Create weight_disputes table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weight_disputes') THEN
        CREATE TABLE "weight_disputes" (
            "id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "order_id" BIGINT NOT NULL,
            "user_id" UUID NOT NULL,
            "applied_weight" DECIMAL(10,3) NOT NULL,
            "charged_weight" DECIMAL(10,3) NOT NULL,
            "applied_amount" DECIMAL(12,2) NOT NULL,
            "charged_amount" DECIMAL(12,2) NOT NULL,
            "difference_amount" DECIMAL(12,2) NOT NULL,
            "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
            "action_reason" TEXT,
            "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "discrepancy_description" TEXT,
            "packed_box_image" TEXT,
            "product_category" VARCHAR(100),
            "weight_scale_image" TEXT,

            CONSTRAINT "weight_disputes_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Create rto_disputes table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rto_disputes') THEN
        CREATE TABLE "rto_disputes" (
            "id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "order_id" BIGINT NOT NULL,
            "user_id" UUID NOT NULL,
            "reason" TEXT NOT NULL,
            "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
            "action_reason" TEXT,
            "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "rto_disputes_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Create feedbacks table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedbacks') THEN
        CREATE TABLE "feedbacks" (
            "id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "user_id" UUID NOT NULL,
            "subject" VARCHAR(255) NOT NULL,
            "message" TEXT NOT NULL,
            "type" TEXT NOT NULL DEFAULT 'FEEDBACK',
            "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Create courier_configurations table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_configurations') THEN
        CREATE TABLE "courier_configurations" (
            "id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "courier_company_id" INTEGER NOT NULL,
            "custom_tag" VARCHAR(100),
            "is_vyom" BOOLEAN NOT NULL DEFAULT false,
            "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "courier_configurations_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Create indexes if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'weight_disputes_order_id_key') THEN
        CREATE UNIQUE INDEX "weight_disputes_order_id_key" ON "weight_disputes"("order_id");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'rto_disputes_order_id_key') THEN
        CREATE UNIQUE INDEX "rto_disputes_order_id_key" ON "rto_disputes"("order_id");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'courier_configurations_courier_company_id_key') THEN
        CREATE UNIQUE INDEX "courier_configurations_courier_company_id_key" ON "courier_configurations"("courier_company_id");
    END IF;
END $$;

-- Add foreign keys if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'support_tickets_user_id_fkey') THEN
        ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'weight_disputes_order_id_fkey') THEN
        ALTER TABLE "weight_disputes" ADD CONSTRAINT "weight_disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'weight_disputes_user_id_fkey') THEN
        ALTER TABLE "weight_disputes" ADD CONSTRAINT "weight_disputes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'rto_disputes_order_id_fkey') THEN
        ALTER TABLE "rto_disputes" ADD CONSTRAINT "rto_disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'rto_disputes_user_id_fkey') THEN
        ALTER TABLE "rto_disputes" ADD CONSTRAINT "rto_disputes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'feedbacks_user_id_fkey') THEN
        ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
