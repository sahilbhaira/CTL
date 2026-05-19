import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './env';

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'implicit',
    persistSession: true,
    storageKey: 'ctl-supabase-auth'
  }
});
