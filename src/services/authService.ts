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

const isMissingPkceVerifierError = (error: AuthError | null) =>
  Boolean(error?.message.toLowerCase().includes('code verifier'));

const getRedirectUrl = (path: string) => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return `${window.location.origin}${path}`;
};

type SupabaseEmailOtpType =
  | 'email'
  | 'email_change'
  | 'invite'
  | 'magiclink'
  | 'recovery'
  | 'signup';

const getUrlParams = (value = '') => {
  const normalizedValue = value.replace(/^[?#]/, '');

  return new URLSearchParams(normalizedValue);
};

export const hasAuthRedirectParams = (search = '', hash = '') => {
  const searchParams = getUrlParams(search);
  const hashParams = getUrlParams(hash);

  return Boolean(
    searchParams.get('code') ||
      searchParams.get('token_hash') ||
      searchParams.get('error') ||
      hashParams.get('access_token') ||
      hashParams.get('error')
  );
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
        emailRedirectTo: getRedirectUrl('/auth/callback')
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

  async completeEmailRedirect(search = window.location.search, hash = window.location.hash) {
    const searchParams = getUrlParams(search);
    const hashParams = getUrlParams(hash);
    const redirectError =
      searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      searchParams.get('error') ||
      hashParams.get('error');

    if (redirectError) {
      throw new Error(redirectError);
    }

    const code = searchParams.get('code');

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (isMissingPkceVerifierError(error)) {
        throw new Error(
          'This email link was created with an old PKCE session. Please request a fresh link and open it in this browser.'
        );
      }

      throwAuthError(error);
      return data.session;
    }

    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (tokenHash && type) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as SupabaseEmailOtpType
      });

      throwAuthError(error);
      return data.session;
    }

    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      throwAuthError(error);
      return data.session;
    }

    return authService.getSession();
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
