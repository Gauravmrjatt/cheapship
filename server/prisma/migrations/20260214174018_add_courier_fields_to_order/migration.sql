-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "courier_id" INTEGER,
ADD COLUMN     "courier_name" VARCHAR(100),
ADD COLUMN     "shipping_charge" DECIMAL(12,2);
