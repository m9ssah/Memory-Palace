-- Patients table
create table patients (
  id text primary key,
  name text not null,
  age integer not null,
  condition text not null default '',
  notes text not null default '',
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Memories table
create table memories (
  id text primary key,
  title text not null,
  description text,
  image_url text,
  image_path text,
  world_id bigint,
  tags text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Worlds table
create table worlds (
  id bigint generated always as identity primary key,
  memory_id text references memories(id) on delete set null,
  api_world_id text unique not null,
  name text not null,
  model text default 'Marble 0.1-mini',
  marble_url text,
  caption text,
  splats_urls text,
  mesh_url text,
  panorama_url text,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add foreign key from memories to worlds (after worlds table exists)
alter table memories
  add constraint fk_memories_world
  foreign key (world_id) references worlds(id) on delete set null;

-- Sessions table
create table sessions (
  id text primary key,
  memory_id text not null references memories(id),
  world_id bigint references worlds(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes real,
  engagement_score real,
  conversation_log text,
  notes text
);

-- Indexes
create index idx_memories_world_id on memories(world_id);
create index idx_worlds_memory_id on worlds(memory_id);
create index idx_worlds_api_world_id on worlds(api_world_id);
create index idx_sessions_memory_id on sessions(memory_id);
create index idx_sessions_world_id on sessions(world_id);
create index idx_sessions_started_at on sessions(started_at);

-- Seed default patient
insert into patients (id, name, age, condition, notes)
values ('default', 'Patient', 75, 'Early-stage dementia', '');
