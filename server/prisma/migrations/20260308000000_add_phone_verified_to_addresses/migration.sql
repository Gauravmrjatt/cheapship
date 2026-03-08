-- Add phone_verified column to addresses table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'addresses' AND column_name = 'phone_verified') THEN
        ALTER TABLE "addresses" ADD COLUMN "phone_verified" BOOLEAN DEFAULT false;
    END IF;
END $$;
