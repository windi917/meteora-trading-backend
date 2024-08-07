/*
  Warnings:

  - You are about to drop the `Vote` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Vote";

-- CreateTable
CREATE TABLE "UserDeposit" (
    "id" SERIAL NOT NULL,
    "user" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "mint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "pool" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "xAmount" INTEGER NOT NULL,
    "yAmount" INTEGER NOT NULL,
    "minBinId" INTEGER NOT NULL,
    "maxBinId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);
