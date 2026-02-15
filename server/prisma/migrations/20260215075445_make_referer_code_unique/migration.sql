/*
  Warnings:

  - A unique constraint covering the columns `[referer_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "users_referer_code_key" ON "users"("referer_code");
