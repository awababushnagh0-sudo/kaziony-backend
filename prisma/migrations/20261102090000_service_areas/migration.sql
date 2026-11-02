-- DropTable
DROP TABLE "areas";

-- CreateTable
CREATE TABLE "service_areas" (
    "id" UUID NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius_km" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_areas_is_active_idx" ON "service_areas"("is_active");


-- Tripoli, from Janzour to Tajoura and south past the airport road.
INSERT INTO "service_areas" ("id", "name_ar", "name_en", "latitude", "longitude", "radius_km", "updated_at")
VALUES (uuidv7(), 'طرابلس', 'Tripoli', 32.85, 13.18, 30, CURRENT_TIMESTAMP);
