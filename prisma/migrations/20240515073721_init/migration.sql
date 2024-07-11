/*
  Warnings:

  - A unique constraint covering the columns `[txHash]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "periodId" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "periodId" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "VotingPeriod" (
    "id" SERIAL NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3) NOT NULL,
    "votingtitle" TEXT NOT NULL,

    CONSTRAINT "VotingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vote_txHash_key" ON "Vote"("txHash");

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "VotingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "VotingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
