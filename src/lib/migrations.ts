// Database schema, applied from Settings → "Set up database" (owner only). Each step runs once.
// Row-Level Security is ON with no public policies: only the app's server (with the private
// connection string) can read or write. The public Supabase key sees nothing.

export const MIGRATIONS: { version: number; name: string; sql: string }[] = [
  {
    version: 1,
    name: "Leads, conversations, appointments, follow-ups",
    sql: /* sql */ `
create table if not exists leads (
  id text primary key default ('L-' || substr(md5(random()::text), 1, 8)),
  name text not null,
  phone text not null default '',
  email text,
  address text not null default '',
  city text not null default '',
  service text not null default 'Other',
  source text not null default 'Other',
  stage text not null default 'New',
  assigned_to text not null default 'u-owner',
  attempts int not null default 0,
  notes text,
  estimate_amount numeric,
  estimate_sent_at timestamptz,
  estimate_viewed_at timestamptz,
  estimate_pdf text,
  lost_reason text,
  project_id text,
  closed_at timestamptz,
  lat double precision,
  lng double precision,
  monday_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_created_idx on leads (created_at desc);
create index if not exists leads_stage_idx on leads (stage);

create table if not exists lead_messages (
  id bigserial primary key,
  lead_id text not null references leads(id) on delete cascade,
  at timestamptz not null default now(),
  sender text not null check (sender in ('customer','us','robot')),
  channel text not null default 'Text',
  text text not null
);
create index if not exists lead_messages_lead_idx on lead_messages (lead_id, at);

create table if not exists lead_activity (
  id bigserial primary key,
  lead_id text not null references leads(id) on delete cascade,
  at timestamptz not null default now(),
  by_user text not null default 'u-owner',
  kind text not null default 'note',
  text text not null
);
create index if not exists lead_activity_lead_idx on lead_activity (lead_id, at desc);

create table if not exists appointments (
  id bigserial primary key,
  lead_id text references leads(id) on delete cascade,
  project_id text,
  title text not null,
  type text not null default 'Site Visit',
  start_at timestamptz not null,
  duration_min int not null default 60,
  assigned_to text not null default 'u-owner',
  confirmation text not null default 'Reminder scheduled'
);
create index if not exists appointments_start_idx on appointments (start_at);

create table if not exists follow_ups (
  id bigserial primary key,
  lead_id text not null references leads(id) on delete cascade,
  step text not null,
  due timestamptz not null,
  action text not null,
  assigned_to text not null default 'u-office',
  done boolean not null default false
);
create index if not exists follow_ups_due_idx on follow_ups (done, due);

create table if not exists app_settings (key text primary key, value jsonb not null);

alter table leads enable row level security;
alter table lead_messages enable row level security;
alter table lead_activity enable row level security;
alter table appointments enable row level security;
alter table follow_ups enable row level security;
alter table app_settings enable row level security;
`,
  },
  {
    version: 2,
    name: "Private file storage for estimate PDFs",
    sql: /* sql */ `
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public) values ('estimates', 'estimates', false) on conflict (id) do nothing;
  end if;
exception when others then
  raise notice 'storage bucket not created: %', sqlerrm;
end $$;
`,
  },
  {
    version: 3,
    name: "monday import keys",
    sql: /* sql */ `
alter table appointments add column if not exists monday_id text unique;
alter table follow_ups add column if not exists monday_id text unique;
alter table leads add column if not exists monday_board text;
`,
  },
];
