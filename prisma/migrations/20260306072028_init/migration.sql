-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_jobId_fkey";

-- DropForeignKey
ALTER TABLE "job_notes" DROP CONSTRAINT "job_notes_authorId_fkey";

-- DropForeignKey
ALTER TABLE "job_parts" DROP CONSTRAINT "job_parts_itemId_fkey";

-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_customerId_fkey";

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_notes" ADD CONSTRAINT "job_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_parts" ADD CONSTRAINT "job_parts_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
