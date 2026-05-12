alter table public.quotation_requests
  add column if not exists quote_amount numeric(12, 2),
  add column if not exists customer_offer_amount numeric(12, 2),
  add column if not exists response_note text,
  add column if not exists admin_notes text,
  add column if not exists quoted_at timestamptz,
  add column if not exists accepted_at timestamptz;

alter table public.quotation_requests
  drop constraint if exists quotation_requests_status_check;

alter table public.quotation_requests
  add constraint quotation_requests_status_check
  check (
    status in (
      'new',
      'pending',
      'contacted',
      'quoted',
      'sent',
      'negotiating',
      'accepted',
      'closed'
    )
  );

create index if not exists quotation_requests_status_idx
  on public.quotation_requests (status);

