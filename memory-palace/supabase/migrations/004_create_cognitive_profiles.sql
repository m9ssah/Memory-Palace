-- Create cognitive_profiles table for storing speech analysis data
CREATE TABLE IF NOT EXISTS cognitive_profiles (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
  transcript TEXT NOT NULL,
  word_finding_difficulty INTEGER DEFAULT 0,
  vocabulary_richness INTEGER DEFAULT 0,
  information_density INTEGER DEFAULT 0,
  emotional_valence INTEGER DEFAULT 50,
  coherence INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  unique_words INTEGER DEFAULT 0,
  filler_count INTEGER DEFAULT 0,
  summary TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cognitive_profiles_session_id ON cognitive_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_profiles_created_at ON cognitive_profiles(created_at);
