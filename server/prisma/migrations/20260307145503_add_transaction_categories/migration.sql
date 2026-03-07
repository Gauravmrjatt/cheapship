-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "is_draft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_vyom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payout_status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "pickup_location" VARCHAR(255),
ADD COLUMN     "pickup_scheduled_date" TIMESTAMP(6),
ADD COLUMN     "vyom_order_id" VARCHAR(50),
ADD COLUMN     "vyom_shipment_id" VARCHAR(50);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "active_discount" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "default_referred_pickup_id" UUID,
ADD COLUMN     "security_deposit" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "upi_id" VARCHAR(100);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FEEDBACK',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courier_configurations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courier_company_id" INTEGER NOT NULL,
    "custom_tag" VARCHAR(100),
    "is_vyom" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courier_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weight_disputes_order_id_key" ON "weight_disputes"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "rto_disputes_order_id_key" ON "rto_disputes"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "courier_configurations_courier_company_id_key" ON "courier_configurations"("courier_company_id");

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_disputes" ADD CONSTRAINT "weight_disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_disputes" ADD CONSTRAINT "weight_disputes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rto_disputes" ADD CONSTRAINT "rto_disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rto_disputes" ADD CONSTRAINT "rto_disputes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
