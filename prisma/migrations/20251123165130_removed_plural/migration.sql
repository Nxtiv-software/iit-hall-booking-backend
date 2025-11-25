/*
  Warnings:

  - You are about to drop the `Resources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VenueResources` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VenueResources" DROP CONSTRAINT "VenueResources_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "VenueResources" DROP CONSTRAINT "VenueResources_venueId_fkey";

-- DropTable
DROP TABLE "Resources";

-- DropTable
DROP TABLE "VenueResources";

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isAvailable" BOOLEAN DEFAULT true,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueResource" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VenueResource_venueId_resourceId_key" ON "VenueResource"("venueId", "resourceId");

-- AddForeignKey
ALTER TABLE "VenueResource" ADD CONSTRAINT "VenueResource_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueResource" ADD CONSTRAINT "VenueResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
