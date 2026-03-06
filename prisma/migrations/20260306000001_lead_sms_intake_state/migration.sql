-- AlterTable: add smsIntakeState JSON column to leads
ALTER TABLE "leads" ADD COLUMN "smsIntakeState" JSONB;
