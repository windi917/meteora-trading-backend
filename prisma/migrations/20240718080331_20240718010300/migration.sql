-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "votingUser" TEXT NOT NULL,
    "votePower" INTEGER NOT NULL,
    "tokenId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);
