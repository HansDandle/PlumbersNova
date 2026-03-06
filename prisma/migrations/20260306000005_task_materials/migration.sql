-- CreateTable price_book_task_materials
CREATE TABLE IF NOT EXISTS "price_book_task_materials" (
    "id" TEXT NOT NULL,
    "priceBookTaskId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "defaultQuantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "price_book_task_materials_pkey" PRIMARY KEY ("id")
);

-- Unique: one item per task
CREATE UNIQUE INDEX IF NOT EXISTS "price_book_task_materials_priceBookTaskId_itemId_key"
    ON "price_book_task_materials"("priceBookTaskId", "itemId");

-- FK: task
ALTER TABLE "price_book_task_materials"
    ADD CONSTRAINT "price_book_task_materials_priceBookTaskId_fkey"
    FOREIGN KEY ("priceBookTaskId") REFERENCES "price_book_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FK: inventory item
ALTER TABLE "price_book_task_materials"
    ADD CONSTRAINT "price_book_task_materials_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
