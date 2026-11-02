-- CreateTable
CREATE TABLE "app_settings" (
    "id" UUID NOT NULL,
    "browse_radius_km" INTEGER NOT NULL DEFAULT 25,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" UUID NOT NULL,
    "city" "City" NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "areas_city_sort_order_idx" ON "areas"("city", "sort_order");

-- The one settings row.
INSERT INTO "app_settings" ("id", "updated_at") VALUES (uuidv7(), CURRENT_TIMESTAMP);

-- Tripoli's neighborhoods, west to east. The points are each area's rough
-- center; customers see offers within the radius around it.
INSERT INTO "areas" ("id", "city", "name_ar", "name_en", "latitude", "longitude", "sort_order", "updated_at") VALUES
  (uuidv7(), 'TRIPOLI', 'جنزور', 'Janzour', 32.8230, 13.0100, 1, CURRENT_TIMESTAMP),
  (uuidv7(), 'TRIPOLI', 'السراج', 'Al Sarraj', 32.8400, 13.0870, 2, CURRENT_TIMESTAMP),
  (uuidv7(), 'TRIPOLI', 'قرقارش', 'Gargaresh', 32.8560, 13.1050, 3, CURRENT_TIMESTAMP),
  (uuidv7(), 'TRIPOLI', 'حي الأندلس', 'Hay Al Andalus', 32.8690, 13.1380, 4, CURRENT_TIMESTAMP),
  (uuidv7(), 'TRIPOLI', 'الهضبة', 'Al Hadba', 32.8390, 13.1780, 5, CURRENT_TIMESTAMP),
  (uuidv7(), 'TRIPOLI', 'أبو سليم', 'Abu Salim', 32.8520, 13.1850, 6, CURRENT_TIMESTAMP),
  (uuidv7(), 'TRIPOLI', 'وسط المدينة', 'City Centre', 32.8968, 13.1800, 7, CURRENT_TIMESTAMP),
  (uuidv7(), 'TRIPOLI', 'الظهرة', 'Al Dahra', 32.8925, 13.1960, 8, CURRENT_TIMESTAMP),
  (uuidv7(), 'TRIPOLI', 'بن عاشور', 'Ben Ashour', 32.8790, 13.2000, 9, CURRENT_TIMESTAMP),
  (uuidv7(), 'TRIPOLI', 'النوفليين', 'Al Nofliyin', 32.8850, 13.2160, 10, CURRENT_TIMESTAMP),
  (uuidv7(), 'TRIPOLI', 'الفرناج', 'Al Fornaj', 32.8540, 13.2200, 11, CURRENT_TIMESTAMP),
  (uuidv7(), 'TRIPOLI', 'سوق الجمعة', 'Souq Al Juma', 32.8960, 13.2450, 12, CURRENT_TIMESTAMP),
  (uuidv7(), 'TRIPOLI', 'عين زارة', 'Ain Zara', 32.8100, 13.2550, 13, CURRENT_TIMESTAMP),
  (uuidv7(), 'TRIPOLI', 'تاجوراء', 'Tajoura', 32.8820, 13.3500, 14, CURRENT_TIMESTAMP);
