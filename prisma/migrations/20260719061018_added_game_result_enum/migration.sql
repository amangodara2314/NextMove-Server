/*
  Warnings:

  - The `result` column on the `Game` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "GameResult" AS ENUM ('WHITE', 'BLACK', 'DRAW');

-- AlterEnum
ALTER TYPE "GameStatus" ADD VALUE 'TIMEOUT';

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "result",
ADD COLUMN     "result" "GameResult";
