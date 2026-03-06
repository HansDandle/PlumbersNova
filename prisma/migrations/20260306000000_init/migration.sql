-- Plumbing Operations Platform — Initial Migration
-- Generated: 2026-03-06
-- Database: PostgreSQL

-- ─────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────

CREATE TYPE "Role" AS ENUM ('OWNER', 'DISPATCHER', 'TECHNICIAN');
CREATE TYPE "LeadSource" AS ENUM ('PHONE', 'SMS', 'MANUAL');
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED');
CREATE TYPE "JobStatus" AS ENUM (
  'JOB_REQUESTED',
  'SCHEDULED',
  'TECHNICIAN_ASSIGNED',
  'EN_ROUTE',
  'IN_PROGRESS',
  'COMPLETED',
  'INVOICED',
  'PAID'
);
CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'TRUCK', 'SUPPLY_HOUSE');
CREATE TYPE "InvoiceStatus" AS ENUM ('UNSENT', 'SENT', 'PAID');
CREATE TYPE "LineItemType" AS ENUM ('SERVICE_CALL', 'LABOR', 'PART');
CREATE TYPE "MessageDir" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "MessageChannel" AS ENUM ('SMS', 'EMAIL');
CREATE TYPE "NotificationType" AS ENUM (
  'NEW_LEAD',
  'JOB_ASSIGNED',
  'INVENTORY_LOW',
  'JOB_COMPLETED',
  'PAYMENT_RECEIVED'
);

-- ─────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────

CREATE TABLE "users" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "phone"     TEXT,
  "role"      "Role" NOT NULL DEFAULT 'TECHNICIAN',
  "password"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- ─────────────────────────────────────────────
-- customers
-- ─────────────────────────────────────────────

CREATE TABLE "customers" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "phone"     TEXT NOT NULL,
  "address"   TEXT,
  "email"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────
-- leads
-- ─────────────────────────────────────────────

CREATE TABLE "leads" (
  "id"            TEXT NOT NULL,
  "customerId"    TEXT,
  "name"          TEXT NOT NULL,
  "phone"         TEXT NOT NULL,
  "address"       TEXT,
  "description"   TEXT NOT NULL,
  "preferredTime" TEXT,
  "source"        "LeadSource" NOT NULL DEFAULT 'MANUAL',
  "status"        "LeadStatus" NOT NULL DEFAULT 'NEW',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- jobs
-- ─────────────────────────────────────────────

CREATE TABLE "jobs" (
  "id"                 TEXT NOT NULL,
  "leadId"             TEXT,
  "customerId"         TEXT NOT NULL,
  "address"            TEXT NOT NULL,
  "problemDescription" TEXT NOT NULL,
  "technicianId"       TEXT,
  "scheduledTime"      TIMESTAMP(3),
  "scheduledEndTime"   TIMESTAMP(3),
  "status"             "JobStatus" NOT NULL DEFAULT 'JOB_REQUESTED',
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,

  CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "jobs_leadId_key" ON "jobs"("leadId");

ALTER TABLE "jobs"
  ADD CONSTRAINT "jobs_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "leads"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "jobs"
  ADD CONSTRAINT "jobs_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id")
  ON UPDATE CASCADE;

ALTER TABLE "jobs"
  ADD CONSTRAINT "jobs_technicianId_fkey"
  FOREIGN KEY ("technicianId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- job_notes
-- ─────────────────────────────────────────────

CREATE TABLE "job_notes" (
  "id"        TEXT NOT NULL,
  "jobId"     TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "job_notes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "job_notes"
  ADD CONSTRAINT "job_notes_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "jobs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "job_notes"
  ADD CONSTRAINT "job_notes_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id")
  ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- job_photos
-- ─────────────────────────────────────────────

CREATE TABLE "job_photos" (
  "id"        TEXT NOT NULL,
  "jobId"     TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "caption"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "job_photos_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "job_photos"
  ADD CONSTRAINT "job_photos_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "jobs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- inventory_items
-- ─────────────────────────────────────────────

CREATE TABLE "inventory_items" (
  "id"           TEXT NOT NULL,
  "sku"          TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "category"     TEXT,
  "cost"         DOUBLE PRECISION NOT NULL,
  "defaultPrice" DOUBLE PRECISION,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");

-- ─────────────────────────────────────────────
-- inventory_locations
-- ─────────────────────────────────────────────

CREATE TABLE "inventory_locations" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "type"         "LocationType" NOT NULL DEFAULT 'WAREHOUSE',
  "technicianId" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "inventory_locations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "inventory_locations"
  ADD CONSTRAINT "inventory_locations_technicianId_fkey"
  FOREIGN KEY ("technicianId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- inventory_balances
-- ─────────────────────────────────────────────

CREATE TABLE "inventory_balances" (
  "id"         TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "itemId"     TEXT NOT NULL,
  "quantity"   INTEGER NOT NULL DEFAULT 0,
  "updatedAt"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "inventory_balances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_balances_locationId_itemId_key"
  ON "inventory_balances"("locationId", "itemId");

ALTER TABLE "inventory_balances"
  ADD CONSTRAINT "inventory_balances_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "inventory_locations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_balances"
  ADD CONSTRAINT "inventory_balances_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- job_parts
-- ─────────────────────────────────────────────

CREATE TABLE "job_parts" (
  "id"               TEXT NOT NULL,
  "jobId"            TEXT NOT NULL,
  "itemId"           TEXT NOT NULL,
  "quantity"         INTEGER NOT NULL,
  "unitPrice"        DOUBLE PRECISION NOT NULL,
  "sourceLocationId" TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "job_parts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "job_parts"
  ADD CONSTRAINT "job_parts_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "jobs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "job_parts"
  ADD CONSTRAINT "job_parts_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id")
  ON UPDATE CASCADE;

ALTER TABLE "job_parts"
  ADD CONSTRAINT "job_parts_sourceLocationId_fkey"
  FOREIGN KEY ("sourceLocationId") REFERENCES "inventory_locations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- labor_entries
-- ─────────────────────────────────────────────

CREATE TABLE "labor_entries" (
  "id"          TEXT NOT NULL,
  "jobId"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount"      DOUBLE PRECISION NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "labor_entries_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "labor_entries"
  ADD CONSTRAINT "labor_entries_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "jobs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- invoices
-- ─────────────────────────────────────────────

CREATE TABLE "invoices" (
  "id"                TEXT NOT NULL,
  "jobId"             TEXT NOT NULL,
  "serviceCallAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status"            "InvoiceStatus" NOT NULL DEFAULT 'UNSENT',
  "total"             DOUBLE PRECISION NOT NULL DEFAULT 0,
  "externalId"        TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,

  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invoices_jobId_key" ON "invoices"("jobId");

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "jobs"("id")
  ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- invoice_line_items
-- ─────────────────────────────────────────────

CREATE TABLE "invoice_line_items" (
  "id"          TEXT NOT NULL,
  "invoiceId"   TEXT NOT NULL,
  "type"        "LineItemType" NOT NULL,
  "description" TEXT NOT NULL,
  "quantity"    DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unitPrice"   DOUBLE PRECISION NOT NULL,
  "total"       DOUBLE PRECISION NOT NULL,

  CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "invoice_line_items"
  ADD CONSTRAINT "invoice_line_items_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- messages
-- ─────────────────────────────────────────────

CREATE TABLE "messages" (
  "id"         TEXT NOT NULL,
  "customerId" TEXT,
  "leadId"     TEXT,
  "direction"  "MessageDir" NOT NULL,
  "channel"    "MessageChannel" NOT NULL DEFAULT 'SMS',
  "content"    TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "leads"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- notifications
-- ─────────────────────────────────────────────

CREATE TABLE "notifications" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "type"      "NotificationType" NOT NULL,
  "title"     TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "read"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
