-- AlterEnum
ALTER TYPE "ShipmentStatus" ADD VALUE 'DRAFT';

-- CreateTable
CREATE TABLE "security_refund_schedule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scheduled_date" TIMESTAMP(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_refund_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_deposits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "order_id" BIGINT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "used_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "remaining" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_deposits_user_id_idx" ON "security_deposits"("user_id");

-- CreateIndex
CREATE INDEX "security_deposits_order_id_idx" ON "security_deposits"("order_id");

-- AddForeignKey
ALTER TABLE "security_deposits" ADD CONSTRAINT "security_deposits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_deposits" ADD CONSTRAINT "security_deposits_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
