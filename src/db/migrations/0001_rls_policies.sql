-- Enable pgvector extension for trusted environmental knowledge RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- Trusted knowledge documents table with pgvector embedding support
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all private user tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = auth_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = auth_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = auth_id);

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid()::text = auth_id);

-- User Locations
CREATE POLICY "Users manage own locations" ON user_locations
  FOR ALL USING (
    user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
  );

-- Household Profiles
CREATE POLICY "Users manage own household profile" ON household_profiles
  FOR ALL USING (
    user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
  );

-- Household Plants
CREATE POLICY "Users manage own plants" ON household_plants
  FOR ALL USING (
    household_id IN (
      SELECT hp.id FROM household_profiles hp
      JOIN profiles p ON p.id = hp.user_id
      WHERE p.auth_id = auth.uid()::text
    )
  );

-- Household Members
CREATE POLICY "Users manage own household members" ON household_members
  FOR ALL USING (
    household_id IN (
      SELECT hp.id FROM household_profiles hp
      JOIN profiles p ON p.id = hp.user_id
      WHERE p.auth_id = auth.uid()::text
    )
  );

-- Chat Conversations & Messages
CREATE POLICY "Users manage own conversations" ON chat_conversations
  FOR ALL USING (
    user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
  );

CREATE POLICY "Users manage own chat messages" ON chat_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT cc.id FROM chat_conversations cc
      JOIN profiles p ON p.id = cc.user_id
      WHERE p.auth_id = auth.uid()::text
    )
  );

-- AI Recommendations
CREATE POLICY "Users manage own AI recommendations" ON ai_recommendations
  FOR ALL USING (
    user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
  );

-- Notification Preferences & Notifications
CREATE POLICY "Users manage own notification preferences" ON notification_preferences
  FOR ALL USING (
    user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
  );

CREATE POLICY "Users manage own notifications" ON user_notifications
  FOR ALL USING (
    user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
  );

-- Public read access for shared environmental & festival data
ALTER TABLE festival_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read festival events" ON festival_events
  FOR SELECT USING (true);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read trusted knowledge" ON knowledge_documents
  FOR SELECT USING (true);

