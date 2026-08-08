/*
  Warnings:

  - You are about to drop the column `rating` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RatingType" AS ENUM ('BLITZ', 'BULLET', 'RAPID', 'CLASSICAL');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "blackRatingAfter" INTEGER,
ADD COLUMN     "blackRatingBefore" INTEGER,
ADD COLUMN     "blackRatingChange" INTEGER,
ADD COLUMN     "ratingApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whiteRatingAfter" INTEGER,
ADD COLUMN     "whiteRatingBefore" INTEGER,
ADD COLUMN     "whiteRatingChange" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "rating";

-- CreateTable
CREATE TABLE "UserRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RatingType" NOT NULL,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER NOT NULL DEFAULT 1200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserRating_type_rating_idx" ON "UserRating"("type", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "UserRating_userId_type_key" ON "UserRating"("userId", "type");

-- AddForeignKey
ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
