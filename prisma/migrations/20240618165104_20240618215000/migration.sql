/*
  Warnings:

  - Added the required column `baseamount` to the `Pool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quoteamount` to the `Pool` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pool" ADD COLUMN     "baseamount" INTEGER NOT NULL,
ADD COLUMN     "quoteamount" INTEGER NOT NULL;
