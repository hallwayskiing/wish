CREATE TABLE wishes_next (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  categoryName TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  blessings INTEGER NOT NULL DEFAULT 0,
  aiPlan TEXT NOT NULL
);

INSERT INTO wishes_next (id, title, category, categoryName, createdAt, blessings, aiPlan)
SELECT id, title, category, categoryName, createdAt, blessings, aiPlan
FROM wishes;

DROP TABLE wishes;

ALTER TABLE wishes_next RENAME TO wishes;

CREATE INDEX idx_wishes_category_created
  ON wishes (category, createdAt DESC);

CREATE INDEX idx_wishes_created
  ON wishes (createdAt DESC);
