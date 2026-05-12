const readEnv = (key: string) => import.meta.env[key]?.trim();

const requireEnv = (key: string, value: string | undefined) => {
  if (value) {
    return value;
  }

  throw new Error(`Missing required environment variable: ${key}`);
};

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const supabaseUrl = normalizeBaseUrl(
  requireEnv('VITE_SUPABASE_URL', readEnv('VITE_SUPABASE_URL'))
);

const supabaseAnonKey = requireEnv(
  'VITE_SUPABASE_ANON_KEY',
  readEnv('VITE_SUPABASE_ANON_KEY') ?? readEnv('VITE_SUPABASE_ANNONKEY')
);

const supabaseFunctionsUrl = normalizeBaseUrl(
  readEnv('VITE_SUPABASE_FUNCTIONS_URL') ??
    readEnv('VITE_SUPABASE_API') ??
    `${supabaseUrl}/functions/v1`
);

export const supabaseConfig = {
  anonKey: supabaseAnonKey,
  functionsUrl: supabaseFunctionsUrl,
  url: supabaseUrl
};

