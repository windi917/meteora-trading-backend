/*
  Warnings:

  - Added the required column `minimumCount` to the `VoteTokenPair` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VoteTokenPair" ADD COLUMN     "minimumCount" INTEGER NOT NULL;
