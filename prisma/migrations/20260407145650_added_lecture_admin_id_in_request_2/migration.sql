-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_lecturerAdminId_fkey";

-- AlterTable
ALTER TABLE "Request" ALTER COLUMN "lecturerAdminId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_lecturerAdminId_fkey" FOREIGN KEY ("lecturerAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
