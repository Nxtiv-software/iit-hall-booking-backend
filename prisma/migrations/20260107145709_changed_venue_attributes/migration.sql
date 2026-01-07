/*
  Warnings:

  - You are about to drop the column `capacity` on the `Venue` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Venue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Venue" DROP COLUMN "capacity",
DROP COLUMN "type",
ADD COLUMN     "capacityAcademic" TEXT,
ADD COLUMN     "capacityExamination" TEXT;
