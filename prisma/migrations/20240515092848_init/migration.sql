/*
  Warnings:

  - You are about to drop the column `votePowerLimit` on the `Token` table. All the data in the column will be lost.
  - Added the required column `votePowerLimit` to the `VotingPeriod` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Token" DROP COLUMN "votePowerLimit";

-- AlterTable
ALTER TABLE "VotingPeriod" ADD COLUMN     "votePowerLimit" INTEGER NOT NULL;
