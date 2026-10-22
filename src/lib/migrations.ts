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
  {
    version: 4,
    name: "Projects, contracts, payments, expenses",
    sql: /* sql */ `
create table if not exists projects (
  id text primary key,
  monday_id text unique,
  monday_board_id text unique,
  lead_id text,
  customer text not null,
  phone text not null default '',
  email text,
  address text not null default '',
  city text not null default '',
  type text not null default 'Project',
  stage text not null default 'In Progress',
  stuck boolean not null default false,
  sale numeric,
  cost numeric,
  signed_at timestamptz not null default now(),
  origin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists project_contracts (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  n int not null,
  title text not null,
  amount numeric not null default 0,
  signed_at timestamptz,
  status text not null default 'Signed'
);
create table if not exists project_payments (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  contract_n int,
  name text not null,
  amount numeric not null default 0,
  paid_at timestamptz,
  method text,
  status text not null default 'Paid'
);
create table if not exists project_expenses (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  contract_n int,
  vendor text not null,
  amount numeric not null default 0,
  spent_at timestamptz,
  pending boolean not null default false,
  category text not null default 'Other'
);
create index if not exists project_contracts_p on project_contracts (project_id);
create index if not exists project_payments_p on project_payments (project_id);
create index if not exists project_expenses_p on project_expenses (project_id);
alter table projects enable row level security;
alter table project_contracts enable row level security;
alter table project_payments enable row level security;
alter table project_expenses enable row level security;
`,
  },
  {
    version: 5,
    name: "Project files (photos, documents, receipts) + expenses added in the app",
    sql: /* sql */ `
create table if not exists project_files (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  kind text not null,
  phase text,
  name text not null,
  path text not null,
  mime text,
  size bigint,
  expense_id text,
  monday_asset_id text unique,
  added_by text,
  created_at timestamptz not null default now()
);
create index if not exists project_files_p on project_files (project_id);
alter table project_files enable row level security;
alter table project_expenses add column if not exists source text not null default 'monday';
alter table project_expenses add column if not exists by_user text;
`,
  },
  {
    version: 6,
    name: "Log-out-everywhere: sessions older than this time are rejected",
    sql: /* sql */ `
create table if not exists app_logins (
  user_id text primary key,
  valid_after timestamptz not null default now()
);
alter table app_logins enable row level security;
`,
  },
  {
    version: 7,
    name: "Map pins: coordinates for each project address",
    sql: /* sql */ `
alter table projects add column if not exists lat double precision;
alter table projects add column if not exists lng double precision;
alter table projects add column if not exists geo_status text;
`,
  },
  {
    version: 8,
    name: "Estimates made in the app",
    sql: /* sql */ `
create sequence if not exists estimate_number start 600;
create table if not exists estimates (
  id text primary key,
  number int not null unique default nextval('estimate_number'),
  lead_id text references leads(id) on delete set null,
  token text not null unique,
  customer jsonb not null,
  title text not null,
  note text not null default '',
  sections jsonb not null,
  exclusions jsonb not null default '[]',
  schedule jsonb not null,
  total numeric not null default 0,
  valid_days int not null default 30,
  status text not null default 'Draft',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  viewed_at timestamptz,
  approved_at timestamptz,
  approved_name text
);
create index if not exists estimates_lead on estimates (lead_id);
alter table estimates enable row level security;
`,
  },
];
