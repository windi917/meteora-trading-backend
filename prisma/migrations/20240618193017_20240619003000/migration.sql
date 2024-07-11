/*
  Warnings:

  - Added the required column `owner` to the `Pool` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pool" ADD COLUMN     "owner" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Market" (
    "id" SERIAL NOT NULL,
    "marketaddress" TEXT NOT NULL,
    "basemint" TEXT NOT NULL,
    "quotemint" TEXT NOT NULL,
    "baseamount" DOUBLE PRECISION NOT NULL,
    "quoteamount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Market_marketaddress_key" ON "Market"("marketaddress");
