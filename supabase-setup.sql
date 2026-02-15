-- RWTW Bounties Database Setup
-- Run this in Supabase SQL Editor

-- Bounties table
CREATE TABLE bounties (
  id TEXT PRIMARY KEY DEFAULT 'b_' || extract(epoch from now())::bigint::text || '_' || floor(random() * 1000)::text,
  title TEXT NOT NULL,
  description TEXT,
  reward NUMERIC NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  max_claims INTEGER NOT NULL DEFAULT 0,
  claimed INTEGER NOT NULL DEFAULT 0,
  expiry DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'completed')),
  requirements TEXT[] DEFAULT '{}',
  requirement_icons TEXT[] DEFAULT '{}',
  hot BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Submissions table
CREATE TABLE submissions (
  id TEXT PRIMARY KEY DEFAULT 'sub_' || extract(epoch from now())::bigint::text || '_' || floor(random() * 1000)::text,
  bounty_id TEXT REFERENCES bounties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_initials TEXT,
  user_tier TEXT,
  proof_link TEXT,
  proof_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  reward NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  transfer_id TEXT
);

-- Stats table (single row for global stats)
CREATE TABLE stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0
);

-- Insert default stats row
INSERT INTO stats (id, total_paid, completed_count) VALUES (1, 847, 156);

-- Insert seed bounties
INSERT INTO bounties (id, title, description, reward, difficulty, max_claims, claimed, expiry, status, requirements, requirement_icons, hot) VALUES
  ('b1', 'Like, Comment & Repost Our Instagram Reel', 'Engage with our latest reel — like it, drop a comment, and repost to your story. That''s it.', 5, 'easy', 50, 34, NULL, 'active', ARRAY['Like the reel', 'Leave a genuine comment (no spam)', 'Repost to your story', 'Submit screenshot of repost + comment as proof', 'Must have 250+ followers'], ARRAY['❤️', '💬', '🔄', '📸', '👥'], true),
  ('b2', 'Post Your Cashout on Instagram Story', 'Got a winning ticket from our picks? Post the cashout to your IG story and tag @flaregotlocks. Get paid $2 for showing off your win.', 2, 'easy', 0, 89, NULL, 'active', ARRAY['Post winning bet slip to your Instagram Story', 'Tag @flaregotlocks in the story', 'Must be a real sportsbook cashout', 'Must have 250+ followers'], ARRAY['📱', '🏷️', '💰', '👥'], false),
  ('b3', 'Create a TikTok or Reel About RWTW', 'Make a short-form video (TikTok or Instagram Reel) about your RWTW experience. Show your wins, talk about the community, or do a reaction to the picks. Get creative.', 10, 'medium', 25, 12, '2026-02-28', 'active', ARRAY['Create an original video about RWTW', 'Minimum 15 seconds', 'Tag @flaregotlocks and mention RWTW', 'Must have 500+ followers', 'Submit link + screenshot of post'], ARRAY['🎬', '📏', '🏷️', '👥', '📸'], false),
  ('b4', 'Refer a Friend Who Signs Up for Premium', 'Get someone to sign up for an RWTW Premium or High Rollers plan. When they join, you get $25 cash. No limit — refer as many as you want.', 25, 'hard', 0, 21, NULL, 'active', ARRAY['Share your unique referral link', 'Friend must sign up for Premium or High Rollers', 'Submit referral name/username as proof'], ARRAY['🔗', '💳', '📸'], false);

-- Enable Row Level Security (but allow service role full access)
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Policies for service role (full access)
CREATE POLICY "Service role full access bounties" ON bounties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access submissions" ON submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access stats" ON stats FOR ALL USING (true) WITH CHECK (true);
