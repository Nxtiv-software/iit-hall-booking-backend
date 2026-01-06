/*
  Warnings:

  - You are about to drop the `VenueResource` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VenueResource" DROP CONSTRAINT "VenueResource_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "VenueResource" DROP CONSTRAINT "VenueResource_venueId_fkey";

-- AlterTable
ALTER TABLE "Venue" ALTER COLUMN "capacity" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "VenueResource";
