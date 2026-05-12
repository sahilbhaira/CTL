/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_API?: string;
  readonly VITE_SUPABASE_FUNCTIONS_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANNONKEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
