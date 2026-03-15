-- AI Conversations table
-- Stores conversation sessions with their configuration and metadata
create table ai_conversations (
  id text primary key,
  session_id text references sessions(id) on delete set null,
  patient_id text references patients(id) on delete set null,
  title text not null,
  system_prompt text not null,
  context text,
  model text not null default 'gpt-4o-mini',
  temperature real default 0.7,
  max_tokens integer default 1000,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AI Messages table
-- Stores individual messages within a conversation
create table ai_messages (
  id text primary key,
  conversation_id text not null references ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_used integer,
  audio_url text,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_ai_conversations_session_id on ai_conversations(session_id);
create index idx_ai_conversations_patient_id on ai_conversations(patient_id);
create index idx_ai_conversations_status on ai_conversations(status);
create index idx_ai_conversations_created_at on ai_conversations(created_at);
create index idx_ai_messages_conversation_id on ai_messages(conversation_id);
create index idx_ai_messages_created_at on ai_messages(created_at);
