-- NOTE: Enums already exist in database, skipping creation

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_disputes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "applied_weight" DECIMAL(10,3) NOT NULL,
    "charged_weight" DECIMAL(10,3) NOT NULL,
    "applied_amount" DECIMAL(12,2) NOT NULL,
    "charged_amount" DECIMAL(12,2) NOT NULL,
    "difference_amount" DECIMAL(12,2) NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "action_reason" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discrepancy_description" TEXT,
    "packed_box_image" TEXT,
    "product_category" VARCHAR(100),
    "weight_scale_image" TEXT,

    CONSTRAINT "weight_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rto_disputes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "action_reason" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rto_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'FEEDBACK',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courier_configurations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courier_company_id" INTEGER NOT NULL,
    "custom_tag" VARCHAR(100),
    "is_vyom" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courier_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(15),
    "otp_code" VARCHAR(6) NOT NULL,
    "purpose" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temp_registration_data" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "referred_by" VARCHAR(50),
    "franchise_type" "FranchiseType",
    "franchise_address" VARCHAR(500),
    "franchise_pincode" VARCHAR(10),
    "franchise_city" VARCHAR(100),
    "franchise_state" VARCHAR(100),
    "commission_rate" DECIMAL(5,2),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temp_registration_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weight_disputes_order_id_key" ON "weight_disputes"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "rto_disputes_order_id_key" ON "rto_disputes"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "courier_configurations_courier_company_id_key" ON "courier_configurations"("courier_company_id");

-- CreateIndex
CREATE UNIQUE INDEX "temp_registration_data_email_key" ON "temp_registration_data"("email");

-- CreateIndex
CREATE INDEX "otp_verifications_email_purpose_idx" ON "otp_verifications"("email", "purpose");

-- CreateIndex
CREATE INDEX "otp_verifications_mobile_purpose_idx" ON "otp_verifications"("mobile", "purpose");

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_disputes" ADD CONSTRAINT "weight_disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_disputes" ADD CONSTRAINT "weight_disputes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rto_disputes" ADD CONSTRAINT "rto_disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rto_disputes" ADD CONSTRAINT "rto_disputes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
