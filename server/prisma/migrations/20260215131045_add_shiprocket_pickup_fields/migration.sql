-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "is_shiprocket_pickup" BOOLEAN DEFAULT false,
ADD COLUMN     "pickup_nickname" VARCHAR(50);
