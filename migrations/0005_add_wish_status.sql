ALTER TABLE wishes ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE wishes ADD COLUMN completedAt TEXT;

CREATE INDEX IF NOT EXISTS idx_wishes_status_created
  ON wishes (status, createdAt DESC);
