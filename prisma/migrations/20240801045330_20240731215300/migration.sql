/*
  Warnings:

  - You are about to drop the column `amount` on the `UserDeposit` table. All the data in the column will be lost.
  - You are about to drop the column `mint` on the `UserDeposit` table. All the data in the column will be lost.
  - Added the required column `solAmount` to the `UserDeposit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usdcAmount` to the `UserDeposit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserDeposit" DROP COLUMN "amount",
DROP COLUMN "mint",
ADD COLUMN     "solAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "usdcAmount" DOUBLE PRECISION NOT NULL;
