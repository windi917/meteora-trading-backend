/*
  Warnings:

  - Added the required column `logoURL` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenomicsURL` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "logoURL" TEXT NOT NULL,
ADD COLUMN     "tokenomicsURL" TEXT NOT NULL;
