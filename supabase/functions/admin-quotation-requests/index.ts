import { createClient, type User } from 'https://esm.sh/@supabase/supabase-js@2.105.4';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Origin': '*'
};

const statusGroups = {
  accepted: ['accepted', 'closed'],
  negotiating: ['negotiating'],
  pending: ['new', 'pending'],
  sent: ['contacted', 'quoted', 'sent']
};

const allowedStatuses = new Set([
  'accepted',
  'closed',
  'contacted',
  'negotiating',
  'new',
  'pending',
  'quoted',
  'sent'
]);

interface QuotationRequestRow {
  accepted_at: string | null;
  admin_notes: string | null;
  created_at: string;
  customer_email: string;
  customer_name: string;
  customer_offer_amount: number | string | null;
  customer_phone: string;
  id: string;
  notes: string | null;
  quote_amount: number | string | null;
  quoted_at: string | null;
  response_note: string | null;
  service_ids: string[];
  service_names: string[];
  status: string;
  updated_at: string;
}

interface QuotationItemRow {
  id: string;
  product_id: string;
  product_name: string;
  quantity: string;
  request_id: string;
  service_id: string;
  service_name: string;
}

interface UpdatePayload {
  adminNotes?: unknown;
  customerOfferAmount?: unknown;
  id?: unknown;
  quoteAmount?: unknown;
  responseNote?: unknown;
  status?: unknown;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    status
  });

const getBearerToken = (authorization: string | null) => {
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length);
};

const readRoles = (value: unknown) =>
  Array.isArray(value) ? value.filter((role): role is string => typeof role === 'string') : [];

const hasAdminRole = (metadata: Record<string, unknown> | undefined) =>
  metadata?.role === 'admin' || readRoles(metadata?.roles).includes('admin');

const isAdminUser = (user: User) =>
  hasAdminRole(user.app_metadata) || hasAdminRole(user.user_metadata);

const getStatusGroup = (status: string) => {
  if (statusGroups.accepted.includes(status)) {
    return 'accepted';
  }

  if (statusGroups.negotiating.includes(status)) {
    return 'negotiating';
  }

  if (statusGroups.sent.includes(status)) {
    return 'sent';
  }

  return 'pending';
};

const trimString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const parseAmount = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const amount = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));

  if (!Number.isFinite(amount) || amount < 0) {
    return undefined;
  }

  return amount;
};

const toQuote = (quote: QuotationRequestRow, items: QuotationItemRow[]) => ({
  adminNotes: quote.admin_notes,
  createdAt: quote.created_at,
  customer: {
    email: quote.customer_email,
    name: quote.customer_name,
    phone: quote.customer_phone
  },
  customerOfferAmount: quote.customer_offer_amount,
  id: quote.id,
  notes: quote.notes,
  products: items
    .filter((item) => item.request_id === quote.id)
    .map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      serviceId: item.service_id,
      serviceName: item.service_name
    })),
  quoteAmount: quote.quote_amount,
  responseNote: quote.response_note,
  serviceIds: quote.service_ids,
  serviceNames: quote.service_names,
  status: quote.status,
  updatedAt: quote.updated_at
});

const createStats = (quotes: QuotationRequestRow[]) =>
  quotes.reduce(
    (stats, quote) => {
      const group = getStatusGroup(quote.status);

      stats.total += 1;
      stats[group] += 1;
      stats.responded = stats.sent;

      return stats;
    },
    {
      accepted: 0,
      negotiating: 0,
      pending: 0,
      responded: 0,
      sent: 0,
      total: 0
    }
  );

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'GET' && request.method !== 'PATCH') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ error: 'Supabase environment is not configured' }, 500);
  }

  const bearerToken = getBearerToken(request.headers.get('Authorization'));

  if (!bearerToken) {
    return jsonResponse({ error: 'Authentication is required' }, 401);
  }

  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        Authorization: request.headers.get('Authorization') ?? ''
      }
    }
  });

  const {
    data: { user },
    error: userError
  } = await supabaseAuth.auth.getUser(bearerToken);

  if (userError || !user) {
    return jsonResponse({ error: 'Authentication is required' }, 401);
  }

  if (!isAdminUser(user)) {
    return jsonResponse({ error: 'Admin access is required' }, 403);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  });

  if (request.method === 'PATCH') {
    let payload: UpdatePayload;

    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const id = trimString(payload.id);

    if (!id) {
      return jsonResponse({ error: 'Quotation id is required' }, 400);
    }

    const updateValues: Record<string, number | string | null> = {};

    if (payload.status !== undefined) {
      const status = trimString(payload.status);

      if (!allowedStatuses.has(status)) {
        return jsonResponse({ error: 'Invalid quotation status' }, 400);
      }

      updateValues.status = status;

      if (status === 'quoted' || status === 'sent') {
        updateValues.quoted_at = new Date().toISOString();
      }

      if (status === 'accepted' || status === 'closed') {
        updateValues.accepted_at = new Date().toISOString();
      }
    }

    if (payload.quoteAmount !== undefined) {
      const quoteAmount = parseAmount(payload.quoteAmount);

      if (quoteAmount === undefined) {
        return jsonResponse({ error: 'Quote amount must be a valid number' }, 400);
      }

      updateValues.quote_amount = quoteAmount;
    }

    if (payload.customerOfferAmount !== undefined) {
      const customerOfferAmount = parseAmount(payload.customerOfferAmount);

      if (customerOfferAmount === undefined) {
        return jsonResponse({ error: 'Customer offer must be a valid number' }, 400);
      }

      updateValues.customer_offer_amount = customerOfferAmount;
    }

    if (payload.responseNote !== undefined) {
      updateValues.response_note = trimString(payload.responseNote) || null;
    }

    if (payload.adminNotes !== undefined) {
      updateValues.admin_notes = trimString(payload.adminNotes) || null;
    }

    const { data: updatedQuote, error: updateError } = await supabaseAdmin
      .from('quotation_requests')
      .update(updateValues)
      .eq('id', id)
      .select(
        'id, customer_name, customer_email, customer_phone, notes, service_ids, service_names, status, quote_amount, customer_offer_amount, response_note, admin_notes, quoted_at, accepted_at, created_at, updated_at'
      )
      .single();

    if (updateError || !updatedQuote) {
      return jsonResponse(
        { error: updateError?.message ?? 'Unable to update quotation request' },
        500
      );
    }

    const { data: items, error: itemError } = await supabaseAdmin
      .from('quotation_request_items')
      .select('id, request_id, product_id, product_name, service_id, service_name, quantity')
      .eq('request_id', id);

    if (itemError) {
      return jsonResponse({ error: itemError.message }, 500);
    }

    return jsonResponse(toQuote(updatedQuote as QuotationRequestRow, (items ?? []) as QuotationItemRow[]));
  }

  const url = new URL(request.url);
  const filter = url.searchParams.get('status') ?? 'all';
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 100) || 100, 250);

  const { data: requests, error: requestError } = await supabaseAdmin
    .from('quotation_requests')
    .select(
      'id, customer_name, customer_email, customer_phone, notes, service_ids, service_names, status, quote_amount, customer_offer_amount, response_note, admin_notes, quoted_at, accepted_at, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (requestError) {
    return jsonResponse({ error: requestError.message }, 500);
  }

  const requestRows = (requests ?? []) as QuotationRequestRow[];
  const stats = createStats(requestRows);
  const requestIds = requestRows.map((quote) => quote.id);
  let itemRows: QuotationItemRow[] = [];

  if (requestIds.length) {
    const { data: items, error: itemError } = await supabaseAdmin
      .from('quotation_request_items')
      .select('id, request_id, product_id, product_name, service_id, service_name, quantity')
      .in('request_id', requestIds);

    if (itemError) {
      return jsonResponse({ error: itemError.message }, 500);
    }

    itemRows = (items ?? []) as QuotationItemRow[];
  }

  const filteredRows = requestRows.filter((quote) => {
    const matchesStatus =
      filter === 'all' ||
      (filter in statusGroups &&
        statusGroups[filter as keyof typeof statusGroups].includes(quote.status));

    if (!matchesStatus) {
      return false;
    }

    if (!search) {
      return true;
    }

    const searchableText = [
      quote.customer_email,
      quote.customer_name,
      quote.customer_phone,
      quote.id,
      quote.notes ?? '',
      ...quote.service_names
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(search);
  });

  return jsonResponse({
    quotes: filteredRows.map((quote) => toQuote(quote, itemRows)),
    stats
  });
});

