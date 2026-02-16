-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "franchise_commission_amount" DECIMAL(12,2),
ADD COLUMN     "franchise_commission_rate" DECIMAL(5,2),
ADD COLUMN     "global_commission_amount" DECIMAL(12,2),
ADD COLUMN     "global_commission_rate" DECIMAL(5,2),
ADD COLUMN     "height" DECIMAL(10,2),
ADD COLUMN     "length" DECIMAL(10,2),
ADD COLUMN     "width" DECIMAL(10,2);
