alter table public.quotation_requests
  add column if not exists customer_response_note text,
  add column if not exists customer_responded_at timestamptz;

