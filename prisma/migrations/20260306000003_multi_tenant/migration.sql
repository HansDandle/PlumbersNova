-- CreateTable: companies
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- AlterTable: users — add companyId
ALTER TABLE "users" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT '';

-- AlterTable: customers
ALTER TABLE "customers" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT '';

-- AlterTable: leads
ALTER TABLE "leads" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT '';

-- AlterTable: jobs
ALTER TABLE "jobs" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT '';

-- AlterTable: inventory_items — drop old unique on sku, add companyId
ALTER TABLE "inventory_items" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT '';
DROP INDEX IF EXISTS "inventory_items_sku_key";

-- AlterTable: inventory_locations
ALTER TABLE "inventory_locations" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT '';

-- AlterTable: invoices
ALTER TABLE "invoices" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT '';

-- AlterTable: messages
ALTER TABLE "messages" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT '';

-- AddForeignKey constraints (after data backfill, remove DEFAULT '')
ALTER TABLE "users"               ADD CONSTRAINT "users_companyId_fkey"               FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customers"           ADD CONSTRAINT "customers_companyId_fkey"           FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leads"               ADD CONSTRAINT "leads_companyId_fkey"               FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jobs"                ADD CONSTRAINT "jobs_companyId_fkey"                FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items"     ADD CONSTRAINT "inventory_items_companyId_fkey"     FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_locations" ADD CONSTRAINT "inventory_locations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices"            ADD CONSTRAINT "invoices_companyId_fkey"            FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages"            ADD CONSTRAINT "messages_companyId_fkey"            FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: compound unique on inventory_items
CREATE UNIQUE INDEX "inventory_items_companyId_sku_key" ON "inventory_items"("companyId", "sku");
