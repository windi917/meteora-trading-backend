/*
  Warnings:

  - A unique constraint covering the columns `[tokenMint]` on the table `VoteToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VoteToken_tokenMint_key" ON "VoteToken"("tokenMint");
