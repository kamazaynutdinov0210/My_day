-- Full-text search for notes. Paste into the init migration.sql in place of
-- the plain "search_vector" column Prisma generates. See docs/DATABASE.md.

ALTER TABLE "notes" DROP COLUMN IF EXISTS "search_vector";

ALTER TABLE "notes"
  ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("content", '')), 'B')
  ) STORED;

CREATE INDEX "notes_search_vector_idx" ON "notes" USING GIN ("search_vector");
