import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { useQuoteDraftStore } from './quoteDraftStore';

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
  clearSession: () => {
    useQuoteDraftStore.getState().clearDraft();

    set({
      isGuest: false,
      isAuthenticated: false,
      session: null,
      user: null
    });
  },
  setAuthReady: (isAuthReady) => set({ isAuthReady }),
  setGuestSession: () => {
    useQuoteDraftStore.getState().clearDraft();

    set({
      isGuest: true,
      isAuthenticated: false,
      session: null,
      user: null
    });
  },
  setSession: (session) => {
    const quoteDraftStore = useQuoteDraftStore.getState();

    if (
      session &&
      quoteDraftStore.ownerUserId &&
      quoteDraftStore.ownerUserId !== session.user.id
    ) {
      quoteDraftStore.clearDraft();
    }

    set((state) => ({
      isGuest: session ? false : state.isGuest,
      isAuthenticated: Boolean(session?.user),
      session,
      user: session?.user ?? null
    }));
  }
}));
