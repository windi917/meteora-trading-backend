/*
  Warnings:

  - You are about to drop the column `maxBinId` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `minBinId` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `strategy` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `xAmount` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `yAmount` on the `Position` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Position" DROP COLUMN "maxBinId",
DROP COLUMN "minBinId",
DROP COLUMN "strategy",
DROP COLUMN "xAmount",
DROP COLUMN "yAmount";
