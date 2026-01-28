/*
  Warnings:

  - You are about to drop the `RequestTimeSlot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TimeSlot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RequestTimeSlot" DROP CONSTRAINT "RequestTimeSlot_requestId_fkey";

-- DropForeignKey
ALTER TABLE "RequestTimeSlot" DROP CONSTRAINT "RequestTimeSlot_timeSlotId_fkey";

-- DropTable
DROP TABLE "RequestTimeSlot";

-- DropTable
DROP TABLE "TimeSlot";

-- CreateTable
CREATE TABLE "RequestResource" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,

    CONSTRAINT "RequestResource_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RequestResource" ADD CONSTRAINT "RequestResource_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestResource" ADD CONSTRAINT "RequestResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
