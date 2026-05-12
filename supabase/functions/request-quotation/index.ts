import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.4';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*'
};

interface RequestCustomer {
  email?: unknown;
  name?: unknown;
  phone?: unknown;
}

interface RequestService {
  id?: unknown;
  name?: unknown;
}

interface RequestProduct {
  id?: unknown;
  name?: unknown;
  quantity?: unknown;
  serviceId?: unknown;
  serviceName?: unknown;
}

interface RequestPayload {
  customer?: RequestCustomer;
  notes?: unknown;
  products?: RequestProduct[];
  services?: RequestService[];
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    status
  });

const asTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

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

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ error: 'Supabase environment is not configured' }, 500);
  }

  let payload: RequestPayload;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const customerName = asTrimmedString(payload.customer?.name);
  const customerEmail = asTrimmedString(payload.customer?.email);
  const customerPhone = asTrimmedString(payload.customer?.phone);
  const notes = asTrimmedString(payload.notes);
  const services = Array.isArray(payload.services) ? payload.services : [];
  const products = Array.isArray(payload.products) ? payload.products : [];

  if (!customerName || !customerEmail || !customerPhone) {
    return jsonResponse({ error: 'Name, email, and phone are required' }, 400);
  }

  if (!/^\S+@\S+\.\S+$/.test(customerEmail)) {
    return jsonResponse({ error: 'A valid email is required' }, 400);
  }

  if (!services.length) {
    return jsonResponse({ error: 'At least one service is required' }, 400);
  }

  if (!products.length) {
    return jsonResponse({ error: 'At least one product is required' }, 400);
  }

  const serviceRows = services
    .map((service) => ({
      id: asTrimmedString(service.id),
      name: asTrimmedString(service.name)
    }))
    .filter((service) => service.id && service.name);

  const productRows = products
    .map((product) => ({
      product_id: asTrimmedString(product.id),
      product_name: asTrimmedString(product.name),
      quantity: asTrimmedString(product.quantity),
      service_id: asTrimmedString(product.serviceId),
      service_name: asTrimmedString(product.serviceName)
    }))
    .filter(
      (product) =>
        product.product_id &&
        product.product_name &&
        product.quantity &&
        product.service_id &&
        product.service_name
    );

  if (serviceRows.length !== services.length || productRows.length !== products.length) {
    return jsonResponse({ error: 'Selected services and products must be complete' }, 400);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  });
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

  const bearerToken = getBearerToken(request.headers.get('Authorization'));
  const { data: authData } = bearerToken
    ? await supabaseAuth.auth.getUser(bearerToken)
    : { data: { user: null } };

  const { data: quotation, error: quotationError } = await supabaseAdmin
    .from('quotation_requests')
    .insert({
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      notes: notes || null,
      service_ids: serviceRows.map((service) => service.id),
      service_names: serviceRows.map((service) => service.name),
      user_id: authData.user?.id ?? null
    })
    .select('id')
    .single();

  if (quotationError || !quotation) {
    return jsonResponse(
      { error: quotationError?.message ?? 'Unable to create quotation request' },
      500
    );
  }

  const { error: itemsError } = await supabaseAdmin.from('quotation_request_items').insert(
    productRows.map((product) => ({
      ...product,
      request_id: quotation.id
    }))
  );

  if (itemsError) {
    await supabaseAdmin.from('quotation_requests').delete().eq('id', quotation.id);
    return jsonResponse({ error: itemsError.message }, 500);
  }

  return jsonResponse({
    id: quotation.id,
    message: 'Quotation request submitted successfully'
  });
});

