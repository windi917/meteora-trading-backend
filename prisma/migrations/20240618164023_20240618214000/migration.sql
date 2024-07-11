-- CreateTable
CREATE TABLE "Pool" (
    "id" SERIAL NOT NULL,
    "pooladdress" TEXT NOT NULL,
    "marketaddress" TEXT NOT NULL,
    "basemint" TEXT NOT NULL,
    "quotemint" TEXT NOT NULL,
    "lpmint" TEXT NOT NULL,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pool_pooladdress_key" ON "Pool"("pooladdress");
