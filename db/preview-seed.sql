-- Fictional test data for the PREVIEW database only (never production).
-- Every name, phone, email and address here is made up (555 numbers, example.com).
-- Run it once in the test Supabase project's SQL Editor, AFTER Settings → "Set up database" in the Preview app.

insert into leads (id, name, phone, email, address, city, service, source, stage, assigned_to, created_at) values
  ('L-test1', 'Test Lead One',   '(619) 555-0101', 'lead1@example.com', '10 Test St',  'San Diego',   'Bathroom Remodel',   'Google',    'New',             'u-owner', now() - interval '1 day'),
  ('L-test2', 'Test Lead Two',   '(619) 555-0102', 'lead2@example.com', '20 Test St',  'La Mesa',     'Kitchen Remodel',    'Yelp',      'Appointment Set', 'u-owner', now() - interval '5 days'),
  ('L-test3', 'Test Lead Three', '(619) 555-0103', 'lead3@example.com', '30 Test St',  'Chula Vista', 'Pavers & Hardscape', 'Thumbtack', 'Estimate Sent',   'u-owner', now() - interval '12 days')
on conflict (id) do nothing;

insert into appointments (lead_id, title, type, start_at, assigned_to)
  values ('L-test2', 'Site visit — Test Lead Two', 'Site Visit', date_trunc('day', now()) + interval '1 day 17 hours', 'u-owner');

insert into follow_ups (lead_id, step, due, action, assigned_to)
  values ('L-test3', 'Day 3', now() - interval '1 day', 'Call + text: answer questions, book second meeting', 'u-office');

insert into projects (id, customer, phone, email, address, city, type, stage, sale, signed_at) values
  ('P-test1', 'Test Project Active', '(619) 555-0201', 'project1@example.com', '40 Test St', 'San Diego', 'Bathroom Remodel', 'In Progress', 32000, now() - interval '30 days'),
  ('P-test2', 'Test Project Done',   '(619) 555-0202', 'project2@example.com', '50 Test St', 'El Cajon',  'ADU',              'Completed',   180000, now() - interval '300 days')
on conflict (id) do nothing;

insert into project_contracts (id, project_id, n, title, amount, signed_at) values
  ('PC-test1', 'P-test1', 1, 'Contract', 32000, now() - interval '30 days'),
  ('PC-test2', 'P-test2', 1, 'Contract', 180000, now() - interval '300 days')
on conflict (id) do nothing;

insert into project_payments (id, project_id, contract_n, name, amount, paid_at, method, status) values
  ('PP-test1', 'P-test1', 1, 'Deposit', 1000,   now() - interval '29 days', 'Zelle', 'Paid'),
  ('PP-test2', 'P-test1', 1, 'Demo',    9000,   null,                       null,    'Invoiced'),
  ('PP-test3', 'P-test2', 1, 'Final',   179000, now() - interval '200 days', 'Check', 'Paid')
on conflict (id) do nothing;

insert into project_expenses (id, project_id, vendor, amount, spent_at, category, source) values
  ('PE-test1', 'P-test1', 'Test Supply Co.', 1250.40, now() - interval '20 days', 'Materials', 'app')
on conflict (id) do nothing;

-- One estimate already "sent", so the customer approval page can be tested at /e/preview-test-estimate-token-0001
insert into estimates (id, lead_id, token, customer, title, note, sections, exclusions, schedule, total, status, sent_at)
values (
  'E-test1', 'L-test3', 'preview-test-estimate-token-0001',
  '{"name": "Test Lead Three", "email": "lead3@example.com", "phone": "(619) 555-0103", "address": "30 Test St, Chula Vista, CA 91910"}',
  'Pavers & new fence', 'Thank you for having me over. This is a test estimate with fictional data.',
  '[{"title": "Pavers", "price": 18500, "steps": [{"title": "Demolition", "items": ["Remove the existing surface"], "photos": []}, {"title": "Pavers", "items": ["Supply and install pavers"], "photos": []}]},
    {"title": "New fence", "price": 7200, "steps": [{"title": "Fence", "items": ["6 ft fence, 60 LF"], "photos": []}]}]',
  '["Permit fees (billed at cost)"]',
  '[{"name": "Upon start of work", "pct": 50}, {"name": "Upon base complete", "pct": 30}, {"name": "Project completion", "pct": 20}]',
  25700, 'Sent', now() - interval '2 days'
) on conflict (id) do nothing;
