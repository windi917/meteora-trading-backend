-- CreateTable
CREATE TABLE "PoolUser" (
    "id" SERIAL NOT NULL,
    "user" INTEGER NOT NULL,
    "pool" TEXT NOT NULL,
    "sol_usdc" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoolUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PoolUser_user_pool_key" ON "PoolUser"("user", "pool");
