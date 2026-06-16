/*
  Warnings:

  - You are about to drop the column `promtion` on the `Move` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Move" DROP COLUMN "promtion",
ADD COLUMN     "promotion" "PieceType";
