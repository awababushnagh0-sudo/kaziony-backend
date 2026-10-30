-- AlterTable
ALTER TABLE "claims" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "offers" ALTER COLUMN "max_per_user" DROP NOT NULL,
ALTER COLUMN "max_per_user" DROP DEFAULT;
