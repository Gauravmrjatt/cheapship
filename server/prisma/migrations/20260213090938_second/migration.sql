-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "delivered_at" TIMESTAMP,
ADD COLUMN     "weight" DECIMAL(10,2);
