-- Run this in Supabase SQL Editor
-- Adds leaderboard table

CREATE TABLE leaderboard (
  id TEXT PRIMARY KEY DEFAULT 'lb_' || extract(epoch from now())::bigint::text || '_' || floor(random() * 1000)::text,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  earned NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access leaderboard" ON leaderboard FOR ALL USING (true) WITH CHECK (true);

-- Seed initial leaderboard
INSERT INTO leaderboard (id, name, initials, earned) VALUES
  ('lb_1', 'Marcus R.', 'MR', 87),
  ('lb_2', 'Jake T.', 'JT', 62),
  ('lb_3', 'Austin S.', 'AS', 54);
