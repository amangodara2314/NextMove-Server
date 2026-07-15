/*
  Warnings:

  - Added the required column `timeControl` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TimeControl" AS ENUM ('BULLET_1_0', 'BLITZ_3_0', 'BLITZ_5_0', 'RAPID_10_0', 'RAPID_15_0', 'RAPID_25_0');

-- AlterEnum
ALTER TYPE "GameStatus" ADD VALUE 'DRAW';

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "blackTimeLeft" INTEGER,
ADD COLUMN     "timeControl" "TimeControl" NOT NULL,
ADD COLUMN     "whiteTimeLeft" INTEGER;
