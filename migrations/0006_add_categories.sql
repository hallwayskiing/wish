-- 0006: introduce categories (multi) — add column, backfill, migrate legacy, and drop category/categoryName NOT NULL
ALTER TABLE wishes ADD COLUMN categories TEXT;

UPDATE wishes SET categories = '["' || category || '"]' WHERE categories IS NULL OR trim(categories) = '';
UPDATE wishes SET categories = REPLACE(categories, '"love"', '"relationship"') WHERE categories LIKE '%"love"%';

-- Recreate table without legacy NOT NULL columns category/categoryName (clean schema for new code)
CREATE TABLE IF NOT EXISTS wishes_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  categories TEXT,
  createdAt TEXT NOT NULL,
  blessings INTEGER NOT NULL DEFAULT 0,
  aiPlan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  completedAt TEXT
);
INSERT OR IGNORE INTO wishes_new (id, title, categories, createdAt, blessings, aiPlan, status, completedAt)
SELECT id, title, categories, createdAt, blessings, aiPlan, status, completedAt FROM wishes;
DROP TABLE wishes;
ALTER TABLE wishes_new RENAME TO wishes;

CREATE INDEX IF NOT EXISTS idx_wishes_created ON wishes (createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_wishes_status_created ON wishes (status, createdAt DESC);
