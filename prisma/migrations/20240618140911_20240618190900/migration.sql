-- CreateTable
CREATE TABLE "PoolToken" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "decimals" TEXT NOT NULL,

    CONSTRAINT "PoolToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PoolToken_tokenMint_key" ON "PoolToken"("tokenMint");
