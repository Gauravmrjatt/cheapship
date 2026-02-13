-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'NORMAL');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('SURFACE', 'EXPRESS');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('MANIFESTED', 'IN_TRANSIT', 'DISPATCHED', 'DELIVERED', 'NOT_PICKED', 'PENDING', 'CANCELLED', 'RTO');

-- CreateEnum
CREATE TYPE "ShipmentType" AS ENUM ('DOMESTIC', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('PREPAID', 'COD');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "referer_code" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_type" "UserType" NOT NULL DEFAULT 'NORMAL',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "complete_address" TEXT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "is_default" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_login_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "ip_address" INET,
    "device_info" TEXT,
    "user_agent" TEXT,
    "login_status" VARCHAR(20) NOT NULL,
    "login_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "order_type" "OrderType" NOT NULL,
    "shipment_status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "shipment_type" "ShipmentType" NOT NULL,
    "payment_mode" "PaymentMode" NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_pickup_addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" BIGINT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255),
    "address" TEXT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',

    CONSTRAINT "order_pickup_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_receiver_addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" BIGINT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255),
    "address" TEXT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',

    CONSTRAINT "order_receiver_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "order_pickup_addresses_order_id_key" ON "order_pickup_addresses"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_receiver_addresses_order_id_key" ON "order_receiver_addresses"("order_id");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_login_history" ADD CONSTRAINT "user_login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_pickup_addresses" ADD CONSTRAINT "order_pickup_addresses_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_receiver_addresses" ADD CONSTRAINT "order_receiver_addresses_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
