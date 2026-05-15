-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "fileBlob" BYTEA,
ADD COLUMN     "storagePath" TEXT,
ALTER COLUMN "filePath" DROP NOT NULL;
