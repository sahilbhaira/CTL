import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.4';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Origin': '*'
};

interface QuotationRequestRow {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  service_ids: string[];
  service_names: string[];
  status: string;
  created_at: string;
  updated_at: string;
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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'GET') {
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

  const { data: requests, error: requestError } = await supabaseAdmin
    .from('quotation_requests')
    .select(
      'id, customer_name, customer_email, customer_phone, notes, service_ids, service_names, status, created_at, updated_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (requestError) {
    return jsonResponse({ error: requestError.message }, 500);
  }

  const requestRows = (requests ?? []) as QuotationRequestRow[];
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
    quotes: requestRows.map((quote) => ({
      createdAt: quote.created_at,
      customer: {
        email: quote.customer_email,
        name: quote.customer_name,
        phone: quote.customer_phone
      },
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
      status: quote.status,
      updatedAt: quote.updated_at
    }))
  });
});
