/*
  Warnings:

  - You are about to drop the `referral_level_commissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('WALLET_TOPUP', 'ORDER_PAYMENT', 'REFUND', 'COD_REMITTANCE', 'COMMISSION');

-- CreateEnum
CREATE TYPE "RemittanceStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'PROCESSING', 'REMITTED', 'FAILED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cod_amount" DECIMAL(12,2),
ADD COLUMN     "manifest_generated_at" TIMESTAMP,
ADD COLUMN     "products" JSONB,
ADD COLUMN     "remittance_id" VARCHAR(100),
ADD COLUMN     "remittance_ref_id" VARCHAR(100),
ADD COLUMN     "remittance_status" "RemittanceStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
ADD COLUMN     "remitted_amount" DECIMAL(12,2),
ADD COLUMN     "remitted_at" TIMESTAMP;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "category" "TransactionCategory" NOT NULL DEFAULT 'WALLET_TOPUP',
ADD COLUMN     "status_reason" VARCHAR(500);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "aadhaar_number" VARCHAR(12),
ADD COLUMN     "aadhaar_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gst_number" VARCHAR(15),
ADD COLUMN     "gst_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kyc_status" "KycStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "pan_number" VARCHAR(10),
ADD COLUMN     "pan_verified" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "referral_level_commissions";

-- CreateTable
CREATE TABLE "referral_level_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "max_levels" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_level_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(15),
    "otp_code" VARCHAR(6) NOT NULL,
    "purpose" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temp_registration_data" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "referred_by" VARCHAR(50),
    "franchise_type" "FranchiseType",
    "franchise_address" VARCHAR(500),
    "franchise_pincode" VARCHAR(10),
    "franchise_city" VARCHAR(100),
    "franchise_state" VARCHAR(100),
    "commission_rate" DECIMAL(5,2),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temp_registration_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_verifications_email_purpose_idx" ON "otp_verifications"("email", "purpose");

-- CreateIndex
CREATE INDEX "otp_verifications_mobile_purpose_idx" ON "otp_verifications"("mobile", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "temp_registration_data_email_key" ON "temp_registration_data"("email");
