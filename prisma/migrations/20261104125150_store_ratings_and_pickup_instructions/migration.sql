-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "pickup_instructions" TEXT,
ADD COLUMN     "rating_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rating_total" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "store_ratings" (
    "id" UUID NOT NULL,
    "claim_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stars" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_ratings_claim_id_key" ON "store_ratings"("claim_id");

-- CreateIndex
CREATE INDEX "store_ratings_store_id_idx" ON "store_ratings"("store_id");

-- CreateIndex
CREATE INDEX "store_ratings_user_id_idx" ON "store_ratings"("user_id");

-- AddForeignKey
ALTER TABLE "store_ratings" ADD CONSTRAINT "store_ratings_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_ratings" ADD CONSTRAINT "store_ratings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_ratings" ADD CONSTRAINT "store_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
