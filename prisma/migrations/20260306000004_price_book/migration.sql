-- Add TASK to LineItemType enum
ALTER TYPE "LineItemType" ADD VALUE IF NOT EXISTS 'TASK';

-- CreateTable price_book_tasks
CREATE TABLE IF NOT EXISTS "price_book_tasks" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "price_book_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable job_tasks
CREATE TABLE IF NOT EXISTS "job_tasks" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "priceBookTaskId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey price_book_tasks -> companies
ALTER TABLE "price_book_tasks"
    ADD CONSTRAINT "price_book_tasks_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey job_tasks -> jobs
ALTER TABLE "job_tasks"
    ADD CONSTRAINT "job_tasks_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey job_tasks -> price_book_tasks
ALTER TABLE "job_tasks"
    ADD CONSTRAINT "job_tasks_priceBookTaskId_fkey"
    FOREIGN KEY ("priceBookTaskId") REFERENCES "price_book_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
