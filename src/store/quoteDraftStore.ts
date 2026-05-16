import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface QuoteDraftServiceBlock {
  id: string;
  productIds: string[];
  productQuantities: Record<string, string>;
  serviceId: string;
}

export interface QuoteDraftValues {
  email: string;
  name: string;
  notes: string;
  phone: string;
  serviceBlocks: QuoteDraftServiceBlock[];
}

interface QuoteDraftCustomer {
  email?: string;
  name?: string;
  phone?: string;
}

interface AddProductToDraftInput {
  customer?: QuoteDraftCustomer;
  ownerUserId: string | null;
  productId: string;
  serviceId: string;
}

interface QuoteDraftState {
  addProductToDraft: (input: AddProductToDraftInput) => void;
  clearDraft: () => void;
  getDraftForUser: (userId: string | null) => QuoteDraftValues | null;
  ownerUserId: string | null;
  removeProductFromDraft: (productId: string) => void;
  setDraft: (values: QuoteDraftValues, ownerUserId: string | null) => void;
  updateProductQuantity: (productId: string, quantity: string) => void;
  values: QuoteDraftValues | null;
}

const createEmptyDraftValues = (customer?: QuoteDraftCustomer): QuoteDraftValues => ({
  email: customer?.email ?? '',
  name: customer?.name ?? '',
  notes: '',
  phone: customer?.phone ?? '',
  serviceBlocks: []
});

const getUsableDraftValues = (
  values: QuoteDraftValues | null,
  customer?: QuoteDraftCustomer
): QuoteDraftValues => {
  if (!values) {
    return createEmptyDraftValues(customer);
  }

  return {
    email: values.email || customer?.email || '',
    name: values.name || customer?.name || '',
    notes: values.notes ?? '',
    phone: values.phone || customer?.phone || '',
    serviceBlocks: Array.isArray(values.serviceBlocks) ? values.serviceBlocks : []
  };
};

export const useQuoteDraftStore = create<QuoteDraftState>()(
  persist(
    (set, get) => ({
      addProductToDraft: ({ customer, ownerUserId, productId, serviceId }) =>
        set((state) => {
          const canUseExistingDraft =
            !state.ownerUserId || state.ownerUserId === ownerUserId;
          const values = getUsableDraftValues(
            canUseExistingDraft ? state.values : null,
            customer
          );
          const serviceBlocks = [...values.serviceBlocks];
          const existingServiceIndex = serviceBlocks.findIndex(
            (block) => block.serviceId === serviceId
          );
          const blankServiceIndex = serviceBlocks.findIndex((block) => !block.serviceId);
          const targetIndex =
            existingServiceIndex >= 0
              ? existingServiceIndex
              : blankServiceIndex >= 0
                ? blankServiceIndex
                : serviceBlocks.length;
          const existingBlock = serviceBlocks[targetIndex] ?? {
            id: `service-${serviceId}`,
            productIds: [],
            productQuantities: {},
            serviceId
          };
          const productIds = existingBlock.productIds.includes(productId)
            ? existingBlock.productIds
            : [...existingBlock.productIds, productId];

          serviceBlocks[targetIndex] = {
            ...existingBlock,
            id: existingBlock.id || `service-${serviceId}`,
            productIds,
            productQuantities: {
              ...existingBlock.productQuantities,
              [productId]: existingBlock.productQuantities[productId] ?? ''
            },
            serviceId
          };

          return {
            ownerUserId,
            values: {
              ...values,
              serviceBlocks
            }
          };
        }),
      clearDraft: () => set({ ownerUserId: null, values: null }),
      getDraftForUser: (userId) => {
        const { ownerUserId, values } = get();

        if (!values) {
          return null;
        }

        if (ownerUserId && ownerUserId !== userId) {
          return null;
        }

        return values;
      },
      ownerUserId: null,
      removeProductFromDraft: (productId) =>
        set((state) => {
          if (!state.values) {
            return state;
          }

          const serviceBlocks = state.values.serviceBlocks
            .map((block) => {
              const productQuantities = { ...block.productQuantities };
              delete productQuantities[productId];

              return {
                ...block,
                productIds: block.productIds.filter(
                  (selectedProductId) => selectedProductId !== productId
                ),
                productQuantities
              };
            })
            .filter((block) => block.productIds.length > 0);

          return {
            ...state,
            values: {
              ...state.values,
              serviceBlocks
            }
          };
        }),
      setDraft: (values, ownerUserId) => set({ ownerUserId, values }),
      updateProductQuantity: (productId, quantity) =>
        set((state) => {
          if (!state.values) {
            return state;
          }

          return {
            ...state,
            values: {
              ...state.values,
              serviceBlocks: state.values.serviceBlocks.map((block) =>
                block.productIds.includes(productId)
                  ? {
                      ...block,
                      productQuantities: {
                        ...block.productQuantities,
                        [productId]: quantity
                      }
                    }
                  : block
              )
            }
          };
        }),
      values: null
    }),
    {
      name: 'ctl-quote-draft',
      partialize: (state) => ({
        ownerUserId: state.ownerUserId,
        values: state.values
      }),
      storage: createJSONStorage(() => localStorage)
    }
  )
);
