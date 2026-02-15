/*
  Warnings:

  - Added the required column `name` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "address_label" VARCHAR(50),
ADD COLUMN     "country" VARCHAR(100) NOT NULL DEFAULT 'India',
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "name" VARCHAR(150) NOT NULL,
ADD COLUMN     "phone" VARCHAR(15) NOT NULL;
