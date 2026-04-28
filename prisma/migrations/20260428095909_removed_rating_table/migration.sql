/*
  Warnings:

  - You are about to drop the `Rating` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_playerId_fkey";

-- AlterTable
ALTER TABLE "Game" ALTER COLUMN "turn" SET DEFAULT 'WHITE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 1200;

-- DropTable
DROP TABLE "Rating";
