CREATE TABLE IF NOT EXISTS snapshots (
  user_id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
