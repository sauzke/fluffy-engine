/*
  Warnings:

  - You are about to drop the column `filepath` on the `Upload` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "audit"."Upload" DROP COLUMN "filepath";
