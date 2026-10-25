/*
  Warnings:

  - You are about to drop the column `search_vector` on the `notes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notes" DROP COLUMN "search_vector";
