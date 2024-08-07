/*
  Warnings:

  - A unique constraint covering the columns `[pool,position]` on the table `Position` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Position_pool_position_key" ON "Position"("pool", "position");
