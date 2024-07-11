-- CreateTable
CREATE TABLE "VoteTokenPair" (
    "id" SERIAL NOT NULL,
    "periodId" INTEGER NOT NULL,
    "voteTokenId" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,

    CONSTRAINT "VoteTokenPair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteToken" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "decimals" TEXT NOT NULL,

    CONSTRAINT "VoteToken_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VoteTokenPair" ADD CONSTRAINT "VoteTokenPair_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "VotingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteTokenPair" ADD CONSTRAINT "VoteTokenPair_voteTokenId_fkey" FOREIGN KEY ("voteTokenId") REFERENCES "VoteToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
