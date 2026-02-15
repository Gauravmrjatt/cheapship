/*
  Warnings:

  - You are about to drop the `franchise_rates` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FranchiseType" AS ENUM ('DIRECT_SELLER', 'DISTRIBUTOR', 'PARTNER');

-- DropForeignKey
ALTER TABLE "franchise_rates" DROP CONSTRAINT "franchise_rates_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "commission_rate" DECIMAL(5,2),
ADD COLUMN     "franchise_address" VARCHAR(500),
ADD COLUMN     "franchise_city" VARCHAR(100),
ADD COLUMN     "franchise_pincode" VARCHAR(10),
ADD COLUMN     "franchise_state" VARCHAR(100),
ADD COLUMN     "franchise_type" "FranchiseType" DEFAULT 'DIRECT_SELLER';

-- DropTable
DROP TABLE "franchise_rates";
