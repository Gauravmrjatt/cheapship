-- AlterTable
ALTER TABLE "users" ADD COLUMN     "referred_by" VARCHAR(50);

-- CreateTable
CREATE TABLE "franchise_rates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "added_slab_grams" INTEGER,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "franchise_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "franchise_rates_user_id_key" ON "franchise_rates"("user_id");

-- AddForeignKey
ALTER TABLE "franchise_rates" ADD CONSTRAINT "franchise_rates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
