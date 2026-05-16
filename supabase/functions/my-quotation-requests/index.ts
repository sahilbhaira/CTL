import { createClient, type User } from 'https://esm.sh/@supabase/supabase-js@2.105.4';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Origin': '*'
};

interface QuotationRequestRow {
  accepted_at: string | null;
  admin_notes: string | null;
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_offer_amount: number | string | null;
  customer_responded_at: string | null;
  customer_response_note: string | null;
  notes: string | null;
  quote_amount: number | string | null;
  quoted_at: string | null;
  response_note: string | null;
  service_ids: string[];
  service_names: string[];
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

interface QuotationItemRow {
  id: string;
  request_id: string;
  product_id: string;
  product_name: string;
  service_id: string;
  service_name: string;
  quantity: string;
}

interface CustomerQuoteResponsePayload {
  action?: unknown;
  customerOfferAmount?: unknown;
  id?: unknown;
  responseNote?: unknown;
}

interface StoredQuoteItem {
  id?: unknown;
  price?: unknown;
  productName?: unknown;
  quantity?: unknown;
}

interface StoredQuoteDetails {
  deliveryCharges?: unknown;
  gstPercent?: unknown;
  items?: StoredQuoteItem[];
  responseNote?: unknown;
  type?: unknown;
}

const quotationRequestSelect =
  'id, user_id, customer_name, customer_email, customer_phone, notes, service_ids, service_names, status, quote_amount, customer_offer_amount, customer_response_note, customer_responded_at, response_note, admin_notes, quoted_at, accepted_at, created_at, updated_at';

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

const trimString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const parseAmount = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const amount = typeof value === 'number' ? value : Number(String(value).replace(/[₹,\s]/g, ''));

  return Number.isFinite(amount) ? amount : null;
};

const canAccessQuote = (quote: QuotationRequestRow, user: User) =>
  quote.user_id === user.id ||
  (!quote.user_id &&
    Boolean(user.email) &&
    quote.customer_email.trim().toLowerCase() === user.email?.trim().toLowerCase());

const parseQuoteDetails = (adminNotes: string | null) => {
  if (!adminNotes) {
    return null;
  }

  try {
    const parsed = JSON.parse(adminNotes) as StoredQuoteDetails;

    if (parsed.type !== 'ctl-admin-quote') {
      return null;
    }

    return {
      deliveryCharges: parseAmount(parsed.deliveryCharges),
      gstPercent: parseAmount(parsed.gstPercent),
      items: Array.isArray(parsed.items)
        ? parsed.items
            .map((item) => ({
              id: typeof item.id === 'string' ? item.id : '',
              price: parseAmount(item.price),
              productName: typeof item.productName === 'string' ? item.productName : '',
              quantity: typeof item.quantity === 'string' ? item.quantity : ''
            }))
            .filter((item) => item.productName || item.quantity || item.price !== null)
        : [],
      responseNote: typeof parsed.responseNote === 'string' ? parsed.responseNote : null
    };
  } catch {
    return null;
  }
};

const sortByNewest = (quotes: QuotationRequestRow[]) =>
  [...quotes].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );

const uniqueById = (quotes: QuotationRequestRow[]) => {
  const seen = new Set<string>();

  return quotes.filter((quote) => {
    if (seen.has(quote.id)) {
      return false;
    }

    seen.add(quote.id);
    return true;
  });
};

const toQuote = (quote: QuotationRequestRow, itemRows: QuotationItemRow[]) => ({
  acceptedAt: quote.accepted_at,
  createdAt: quote.created_at,
  customer: {
    email: quote.customer_email,
    name: quote.customer_name,
    phone: quote.customer_phone
  },
  customerOfferAmount: quote.customer_offer_amount,
  customerRespondedAt: quote.customer_responded_at,
  customerResponseNote: quote.customer_response_note,
  id: quote.id,
  notes: quote.notes,
  products: itemRows
    .filter((item) => item.request_id === quote.id)
    .map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      serviceId: item.service_id,
      serviceName: item.service_name
    })),
  serviceIds: quote.service_ids,
  serviceNames: quote.service_names,
  quoteAmount: quote.quote_amount,
  quoteDetails: parseQuoteDetails(quote.admin_notes),
  quotedAt: quote.quoted_at,
  responseNote: quote.response_note,
  status: quote.status,
  updatedAt: quote.updated_at
});

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

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  });

  if (request.method === 'PATCH') {
    let payload: CustomerQuoteResponsePayload;

    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const id = trimString(payload.id);
    const action = trimString(payload.action);

    if (!id) {
      return jsonResponse({ error: 'Quotation id is required' }, 400);
    }

    if (action !== 'accept' && action !== 'negotiate') {
      return jsonResponse({ error: 'Invalid quotation response action' }, 400);
    }

    const { data: existingQuote, error: existingQuoteError } = await supabaseAdmin
      .from('quotation_requests')
      .select(quotationRequestSelect)
      .eq('id', id)
      .single();

    if (existingQuoteError || !existingQuote) {
      return jsonResponse(
        { error: existingQuoteError?.message ?? 'Quotation request not found' },
        existingQuoteError?.code === 'PGRST116' ? 404 : 500
      );
    }

    const quote = existingQuote as QuotationRequestRow;

    if (!canAccessQuote(quote, user)) {
      return jsonResponse({ error: 'You can only respond to your own quotation' }, 403);
    }

    if (!quote.quote_amount) {
      return jsonResponse({ error: 'Quotation has not been sent by admin yet' }, 400);
    }

    const now = new Date().toISOString();
    const responseNote = trimString(payload.responseNote);
    const updateValues: Record<string, number | string | null> = {
      customer_responded_at: now,
      customer_response_note: responseNote || null,
      user_id: user.id
    };

    if (action === 'accept') {
      updateValues.accepted_at = now;
      updateValues.status = 'accepted';
    } else {
      const customerOfferAmount = parseAmount(payload.customerOfferAmount);

      if (!customerOfferAmount || customerOfferAmount <= 0) {
        return jsonResponse({ error: 'A valid offer amount is required' }, 400);
      }

      updateValues.customer_offer_amount = customerOfferAmount;
      updateValues.status = 'negotiating';
    }

    const { data: updatedQuote, error: updateError } = await supabaseAdmin
      .from('quotation_requests')
      .update(updateValues)
      .eq('id', id)
      .select(quotationRequestSelect)
      .single();

    if (updateError || !updatedQuote) {
      return jsonResponse(
        { error: updateError?.message ?? 'Unable to update quotation response' },
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

    return jsonResponse({
      quote: toQuote(updatedQuote as QuotationRequestRow, (items ?? []) as QuotationItemRow[])
    });
  }

  const { data: userRequests, error: requestError } = await supabaseAdmin
    .from('quotation_requests')
    .select(quotationRequestSelect)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (requestError) {
    return jsonResponse({ error: requestError.message }, 500);
  }

  let emailRequests: QuotationRequestRow[] = [];
  const userEmail = user.email?.trim();

  if (userEmail) {
    const { data: emailRows, error: emailError } = await supabaseAdmin
      .from('quotation_requests')
      .select(quotationRequestSelect)
      .ilike('customer_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(50);

    if (emailError) {
      return jsonResponse({ error: emailError.message }, 500);
    }

    emailRequests = ((emailRows ?? []) as QuotationRequestRow[]).filter(
      (quote) => !quote.user_id || quote.user_id === user.id
    );
  }

  const guestRequestIds = emailRequests
    .filter((quote) => !quote.user_id)
    .map((quote) => quote.id);

  if (guestRequestIds.length) {
    await supabaseAdmin
      .from('quotation_requests')
      .update({ user_id: user.id })
      .in('id', guestRequestIds)
      .is('user_id', null);
  }

  const requestRows = sortByNewest(
    uniqueById([...(userRequests ?? []), ...emailRequests] as QuotationRequestRow[])
  ).slice(0, 50);
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

  return jsonResponse({
    quotes: requestRows.map((quote) => toQuote(quote, itemRows))
  });
});
