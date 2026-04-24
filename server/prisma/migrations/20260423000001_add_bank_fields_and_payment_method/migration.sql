-- Add bank fields and payment method to users table
ALTER TABLE "users" ADD COLUMN "bank_name" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN "beneficiary_name" VARCHAR(150);
ALTER TABLE "users" ADD COLUMN "account_number" VARCHAR(25);
ALTER TABLE "users" ADD COLUMN "ifsc_code" VARCHAR(15);

-- Add payment_method to commission_withdrawals table
ALTER TABLE "commission_withdrawals" ADD COLUMN "payment_method" VARCHAR(20);