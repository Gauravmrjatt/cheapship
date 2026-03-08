-- Add new ShipmentStatus enum values for detailed tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PROCESSING' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ShipmentStatus')) THEN
        ALTER TYPE "ShipmentStatus" ADD VALUE 'PROCESSING';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'OUT_FOR_PICKUP' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ShipmentStatus')) THEN
        ALTER TYPE "ShipmentStatus" ADD VALUE 'OUT_FOR_PICKUP';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PICKED_UP' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ShipmentStatus')) THEN
        ALTER TYPE "ShipmentStatus" ADD VALUE 'PICKED_UP';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'OUT_FOR_DELIVERY' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ShipmentStatus')) THEN
        ALTER TYPE "ShipmentStatus" ADD VALUE 'OUT_FOR_DELIVERY';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RTO_DELIVERED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ShipmentStatus')) THEN
        ALTER TYPE "ShipmentStatus" ADD VALUE 'RTO_DELIVERED';
    END IF;
END $$;
