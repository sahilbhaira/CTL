import type { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  fullName: string;
}

const throwAuthError = (error: AuthError | null) => {
  if (error) {
    throw new Error(error.message);
  }
};

const getRedirectUrl = (path: string) => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return `${window.location.origin}${path}`;
};

export const authService = {
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    throwAuthError(error);
    return data.session;
  },

  async login({ email, password }: LoginPayload) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    throwAuthError(error);
    return data;
  },

  async register({ email, fullName, password }: RegisterPayload) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: getRedirectUrl('/home')
      }
    });

    throwAuthError(error);
    return data;
  },

  async sendPasswordReset(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl('/reset-password')
    });

    throwAuthError(error);
    return data;
  },

  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({
      password
    });

    throwAuthError(error);
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    throwAuthError(error);
  }
};

