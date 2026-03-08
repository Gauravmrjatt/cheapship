-- Add etd column to orders if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'etd') THEN
        ALTER TABLE "orders" ADD COLUMN "etd" VARCHAR(50);
    END IF;
END $$;
