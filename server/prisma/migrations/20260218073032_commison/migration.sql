-- AlterTable
ALTER TABLE "commission_withdrawals" ADD COLUMN     "franchise_id" UUID;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "is_franchise_withdrawn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "label_url" TEXT,
ADD COLUMN     "manifest_url" TEXT,
ADD COLUMN     "rto_charges" DECIMAL(12,2),
ADD COLUMN     "rto_label_url" TEXT,
ADD COLUMN     "shiprocket_order_id" VARCHAR(50),
ADD COLUMN     "shiprocket_shipment_id" VARCHAR(50),
ADD COLUMN     "track_url" TEXT,
ADD COLUMN     "tracking_number" VARCHAR(100);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "max_commission_rate" DECIMAL(5,2),
ADD COLUMN     "min_commission_rate" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "referral_level_commissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "level" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_level_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_referral_commissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" BIGINT NOT NULL,
    "level" INTEGER NOT NULL,
    "referrer_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "is_withdrawn" BOOLEAN NOT NULL DEFAULT false,
    "withdrawn_at" TIMESTAMP(3),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_referral_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" BIGINT NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "status_date" TIMESTAMP NOT NULL,
    "location" VARCHAR(200),
    "shipment_status" VARCHAR(50),
    "activity" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_level_commissions_level_key" ON "referral_level_commissions"("level");

-- CreateIndex
CREATE UNIQUE INDEX "order_referral_commissions_order_id_level_key" ON "order_referral_commissions"("order_id", "level");

-- AddForeignKey
ALTER TABLE "order_referral_commissions" ADD CONSTRAINT "order_referral_commissions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_referral_commissions" ADD CONSTRAINT "order_referral_commissions_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_history" ADD CONSTRAINT "shipment_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
