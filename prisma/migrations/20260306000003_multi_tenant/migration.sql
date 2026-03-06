-- CreateTable: companies
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- Bootstrap company: all pre-existing rows will be assigned to this company
INSERT INTO "companies" ("id", "name") VALUES ('bootstrap-company', 'Demo Plumbing Co.');

-- AlterTable: users — add companyId defaulting to bootstrap company
ALTER TABLE "users" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT 'bootstrap-company';

-- AlterTable: customers
ALTER TABLE "customers" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT 'bootstrap-company';

-- AlterTable: leads
ALTER TABLE "leads" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT 'bootstrap-company';

-- AlterTable: jobs
ALTER TABLE "jobs" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT 'bootstrap-company';

-- AlterTable: inventory_items — drop old unique on sku, add companyId
DROP INDEX IF EXISTS "inventory_items_sku_key";
ALTER TABLE "inventory_items" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT 'bootstrap-company';

-- AlterTable: inventory_locations
ALTER TABLE "inventory_locations" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT 'bootstrap-company';

-- AlterTable: invoices
ALTER TABLE "invoices" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT 'bootstrap-company';

-- AlterTable: messages
ALTER TABLE "messages" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT 'bootstrap-company';

-- AddForeignKey constraints
ALTER TABLE "users"               ADD CONSTRAINT "users_companyId_fkey"               FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customers"           ADD CONSTRAINT "customers_companyId_fkey"           FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leads"               ADD CONSTRAINT "leads_companyId_fkey"               FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jobs"                ADD CONSTRAINT "jobs_companyId_fkey"                FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items"     ADD CONSTRAINT "inventory_items_companyId_fkey"     FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_locations" ADD CONSTRAINT "inventory_locations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices"            ADD CONSTRAINT "invoices_companyId_fkey"            FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages"            ADD CONSTRAINT "messages_companyId_fkey"            FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove the DEFAULT now that all rows are backfilled
ALTER TABLE "users"               ALTER COLUMN "companyId" DROP DEFAULT;
ALTER TABLE "customers"           ALTER COLUMN "companyId" DROP DEFAULT;
ALTER TABLE "leads"               ALTER COLUMN "companyId" DROP DEFAULT;
ALTER TABLE "jobs"                ALTER COLUMN "companyId" DROP DEFAULT;
ALTER TABLE "inventory_items"     ALTER COLUMN "companyId" DROP DEFAULT;
ALTER TABLE "inventory_locations" ALTER COLUMN "companyId" DROP DEFAULT;
ALTER TABLE "invoices"            ALTER COLUMN "companyId" DROP DEFAULT;
ALTER TABLE "messages"            ALTER COLUMN "companyId" DROP DEFAULT;

-- CreateIndex: compound unique on inventory_items
CREATE UNIQUE INDEX "inventory_items_companyId_sku_key" ON "inventory_items"("companyId", "sku");
