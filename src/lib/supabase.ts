import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './env';

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    persistSession: true,
    storageKey: 'ctl-supabase-auth'
  }
});

