import { create } from 'zustand';

interface QuoteAccessState {
  closeLoginPrompt: () => void;
  isLoginPromptOpen: boolean;
  openLoginPrompt: (requestedPath: string) => void;
  requestedPath: string | null;
}

export const useQuoteAccessStore = create<QuoteAccessState>((set) => ({
  closeLoginPrompt: () =>
    set({
      isLoginPromptOpen: false,
      requestedPath: null
    }),
  isLoginPromptOpen: false,
  openLoginPrompt: (requestedPath) =>
    set({
      isLoginPromptOpen: true,
      requestedPath
    }),
  requestedPath: null
}));
