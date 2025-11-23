-- AlterTable
ALTER TABLE "Attachment" ALTER COLUMN "filePath" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "commentText" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Log" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Request" ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "uniEmail" DROP NOT NULL;
