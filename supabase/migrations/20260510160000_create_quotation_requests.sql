create table if not exists public.quotation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null check (char_length(trim(customer_name)) > 0),
  customer_email text not null check (customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_phone text not null check (char_length(trim(customer_phone)) > 0),
  notes text,
  service_ids text[] not null default '{}',
  service_names text[] not null default '{}',
  status text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'closed')),
  source text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotation_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.quotation_requests(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  service_id text not null,
  service_name text not null,
  quantity text not null check (char_length(trim(quantity)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists quotation_requests_created_at_idx
  on public.quotation_requests (created_at desc);

create index if not exists quotation_requests_user_id_idx
  on public.quotation_requests (user_id);

create index if not exists quotation_request_items_request_id_idx
  on public.quotation_request_items (request_id);

alter table public.quotation_requests enable row level security;
alter table public.quotation_request_items enable row level security;

drop policy if exists "Users can read their quotation requests" on public.quotation_requests;
create policy "Users can read their quotation requests"
  on public.quotation_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read their quotation request items" on public.quotation_request_items;
create policy "Users can read their quotation request items"
  on public.quotation_request_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.quotation_requests
      where quotation_requests.id = quotation_request_items.request_id
        and quotation_requests.user_id = auth.uid()
    )
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quotation_requests_set_updated_at on public.quotation_requests;
create trigger quotation_requests_set_updated_at
  before update on public.quotation_requests
  for each row
  execute function public.set_updated_at();

