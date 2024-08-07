/*
  Warnings:

  - Added the required column `amount` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sol_usdc` to the `Position` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "sol_usdc" INTEGER NOT NULL;
