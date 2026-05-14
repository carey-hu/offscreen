-- OpenFocus / OffScreen — Supabase schema
--
-- Run this in the Supabase SQL Editor. It is idempotent: safe to re-run on an
-- existing project. New installs get full tables; existing installs get any
-- missing columns and indexes (notably `deleted_at`, required for soft-delete
-- sync — without it cloud deletes will silently fail).

-- ── focus_sessions ────────────────────────────────────────────────────────
create table if not exists focus_sessions (
  id              uuid primary key,
  user_id         text not null,
  device_id       text not null,
  task_id         uuid,
  title           text not null,
  tag             text not null,
  mode            text not null,
  start_time      timestamptz not null,
  end_time        timestamptz,
  planned_minutes int  not null,
  actual_minutes  int  not null default 0,
  status          text not null,
  focus_score     int,
  note            text,
  created_at      timestamptz not null,
  updated_at      timestamptz not null,
  synced_at       timestamptz,
  deleted_at      timestamptz
);

alter table focus_sessions add column if not exists task_id     uuid;
alter table focus_sessions add column if not exists focus_score int;
alter table focus_sessions add column if not exists note        text;
alter table focus_sessions add column if not exists deleted_at  timestamptz;

create index if not exists focus_sessions_user_id_idx    on focus_sessions(user_id);
create index if not exists focus_sessions_deleted_at_idx on focus_sessions(deleted_at);

-- ── tasks ─────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id              uuid primary key,
  user_id         text not null,
  title           text not null,
  icon            text not null,
  description     text not null default '',
  tag             text not null,
  planned_minutes int,
  updated_at      timestamptz not null,
  deleted_at      timestamptz
);

alter table tasks add column if not exists deleted_at timestamptz;

create index if not exists tasks_user_id_idx    on tasks(user_id);
create index if not exists tasks_deleted_at_idx on tasks(deleted_at);

-- ── task_notes ────────────────────────────────────────────────────────────
create table if not exists task_notes (
  id         uuid primary key,
  user_id    text not null,
  task_id    uuid not null,
  date       date not null,
  content    text not null default '',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

alter table task_notes add column if not exists deleted_at timestamptz;

create index if not exists task_notes_user_id_idx    on task_notes(user_id);
create index if not exists task_notes_task_id_idx    on task_notes(task_id);
create index if not exists task_notes_deleted_at_idx on task_notes(deleted_at);

-- ── mood_entries ──────────────────────────────────────────────────────────
create table if not exists mood_entries (
  id         uuid primary key,
  user_id    text not null,
  date       date not null,
  content    text not null default '',
  position   jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

alter table mood_entries add column if not exists deleted_at timestamptz;

create index if not exists mood_entries_user_id_idx    on mood_entries(user_id);
create index if not exists mood_entries_deleted_at_idx on mood_entries(deleted_at);

-- ── user_settings ─────────────────────────────────────────────────────────
create table if not exists user_settings (
  user_id              text primary key,
  default_mode         text not null,
  pomodoro_minutes     int  not null,
  short_break_minutes  int  not null,
  long_focus_minutes   int  not null,
  theme                text not null,
  notification_enabled boolean not null default true,
  updated_at           timestamptz not null
);

-- ── RLS note ──────────────────────────────────────────────────────────────
-- If you enable Row-Level Security on any of the above tables, make sure your
-- policies allow UPDATE (not just INSERT/SELECT) for the user's own rows —
-- the client uses UPDATE deleted_at = now() to perform soft deletes. A policy
-- that omits UPDATE will cause delete operations to silently affect 0 rows.
