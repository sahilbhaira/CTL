import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

interface AuthState {
  isGuest: boolean;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  session: Session | null;
  user: User | null;
  clearSession: () => void;
  setAuthReady: (isAuthReady: boolean) => void;
  setGuestSession: () => void;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isGuest: false,
  isAuthenticated: false,
  isAuthReady: false,
  session: null,
  user: null,
  clearSession: () =>
    set({
      isGuest: false,
      isAuthenticated: false,
      session: null,
      user: null
    }),
  setAuthReady: (isAuthReady) => set({ isAuthReady }),
  setGuestSession: () =>
    set({
      isGuest: true,
      isAuthenticated: false,
      session: null,
      user: null
    }),
  setSession: (session) =>
    set((state) => ({
      isGuest: session ? false : state.isGuest,
      isAuthenticated: Boolean(session?.user),
      session,
      user: session?.user ?? null
    }))
}));
