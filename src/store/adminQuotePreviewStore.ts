import { create } from 'zustand';
import type { QuoteFormValues } from '../pages/admin/quote/adminQuoteUtils';

interface AdminQuotePreviewState {
  clearPreview: () => void;
  quoteId: string | null;
  setPreview: (quoteId: string, values: QuoteFormValues) => void;
  values: QuoteFormValues | null;
}

export const useAdminQuotePreviewStore = create<AdminQuotePreviewState>((set) => ({
  clearPreview: () => set({ quoteId: null, values: null }),
  quoteId: null,
  setPreview: (quoteId, values) => set({ quoteId, values }),
  values: null
}));
