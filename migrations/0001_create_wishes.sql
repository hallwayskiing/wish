CREATE TABLE IF NOT EXISTS wishes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  categoryName TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  blessings INTEGER NOT NULL DEFAULT 0,
  aiPlan TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wishes_category_created
  ON wishes (category, createdAt DESC);

CREATE INDEX IF NOT EXISTS idx_wishes_created
  ON wishes (createdAt DESC);
