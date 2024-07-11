/*
  Warnings:

  - You are about to drop the column `baseamount` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `quoteamount` on the `Market` table. All the data in the column will be lost.
  - Added the required column `minorder` to the `Market` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tick` to the `Market` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Market" DROP COLUMN "baseamount",
DROP COLUMN "quoteamount",
ADD COLUMN     "minorder" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tick" DOUBLE PRECISION NOT NULL;
