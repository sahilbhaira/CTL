import type {
  AdminQuotationProduct,
  AdminQuotationRequest
} from '../../../services/api/edgeFunctionsApi';

export interface QuoteItemValues {
  id: string;
  locked: boolean;
  price: string;
  productId: string;
  productName: string;
  quantity: string;
  serviceId: string;
  serviceName: string;
}

export interface QuoteFormValues {
  deliveryCharges: string;
  gstPercent: string;
  items: QuoteItemValues[];
  responseNote: string;
}

interface StoredQuoteItem {
  id?: unknown;
  locked?: unknown;
  price?: unknown;
  productId?: unknown;
  productName?: unknown;
  quantity?: unknown;
  serviceId?: unknown;
  serviceName?: unknown;
}

interface StoredQuoteBreakdown {
  deliveryCharges?: unknown;
  gstPercent?: unknown;
  items?: StoredQuoteItem[];
  responseNote?: unknown;
  type?: unknown;
}

export interface QuoteItemGroup {
  items: Array<{
    index: number;
    item: QuoteItemValues;
  }>;
  serviceId: string;
  serviceName: string;
}

export const adminQuoteNotesType = 'ctl-admin-quote';
export const defaultDeliveryCharges = 0;
export const defaultGstPercent = 18;
export const defaultResponseNote =
  'Delivery within 2-3 business days. Please review the quote and confirm to proceed.';
export const customServiceId = 'custom';
export const customServiceName = 'Additional Items';

export const sanitizeNumericInput = (value: string) => value.replace(/\D/g, '');

export const createBlankItem = (
  id: number | string,
  serviceId = customServiceId,
  serviceName = customServiceName
): QuoteItemValues => ({
  id: `custom-${id}`,
  locked: false,
  price: '',
  productId: '',
  productName: '',
  quantity: '',
  serviceId,
  serviceName
});

export const parseNumberInput = (value: number | string | null | undefined) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value ?? '')
    .replace(/[₹,\s]/g, '')
    .trim();

  if (!normalized) {
    return null;
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
};

export const toAmount = (value: number | string | null | undefined) => {
  const amount = parseNumberInput(value);
  return amount && amount > 0 ? amount : 0;
};

const toStoredAmount = (value: unknown) =>
  toAmount(value as number | string | null | undefined);

const toInputValue = (value: unknown, fallback = '') => {
  const amount = parseNumberInput(value as number | string | null | undefined);
  return amount !== null ? String(Math.round(amount)) : fallback;
};

const readString = (value: unknown) => (typeof value === 'string' ? value : '');

export const parseStoredQuoteBreakdown = (adminNotes: string | null) => {
  if (!adminNotes) {
    return null;
  }

  try {
    const parsed = JSON.parse(adminNotes) as StoredQuoteBreakdown;
    return parsed?.type === adminQuoteNotesType ? parsed : null;
  } catch {
    return null;
  }
};

export const calculateQuoteTotals = (values: QuoteFormValues) => {
  const subtotal = values.items.reduce(
    (total, item) => total + toAmount(item.price),
    0
  );
  const delivery = toAmount(values.deliveryCharges);
  const gstRate = toAmount(values.gstPercent);
  const gst = Math.round((subtotal * gstRate) / 100);

  return {
    delivery,
    gst,
    gstRate,
    subtotal,
    total: Math.round(subtotal + delivery + gst)
  };
};

const getFallbackItemPrice = (
  quote: AdminQuotationRequest,
  itemCount: number,
  deliveryCharges: number,
  gstPercent: number
) => {
  const quoteAmount = toAmount(quote.quoteAmount);

  if (!quoteAmount || !itemCount) {
    return '';
  }

  const estimatedSubtotal = Math.max(
    Math.round((quoteAmount - deliveryCharges) / (1 + gstPercent / 100)),
    0
  );

  return estimatedSubtotal ? String(Math.round(estimatedSubtotal / itemCount)) : '';
};

const createRequestItem = (
  product: AdminQuotationProduct,
  fallbackPrice: string
): QuoteItemValues => ({
  id: product.id,
  locked: true,
  price: fallbackPrice,
  productId: product.productId,
  productName: product.productName,
  quantity: product.quantity,
  serviceId: product.serviceId,
  serviceName: product.serviceName || 'Requested Service'
});

const findMatchingRequestItem = (
  requestItems: QuoteItemValues[],
  item: StoredQuoteItem
) => {
  const id = readString(item.id);
  const productId = readString(item.productId);

  return requestItems.find(
    (requestItem) =>
      requestItem.id === id ||
      Boolean(productId && requestItem.productId === productId)
  );
};

export const createInitialValues = (
  quote: AdminQuotationRequest | undefined
): QuoteFormValues => {
  if (!quote) {
    return {
      deliveryCharges: String(defaultDeliveryCharges),
      gstPercent: String(defaultGstPercent),
      items: [createBlankItem('empty')],
      responseNote: defaultResponseNote
    };
  }

  const stored = parseStoredQuoteBreakdown(quote.adminNotes);
  const deliveryCharges = toStoredAmount(stored?.deliveryCharges) || defaultDeliveryCharges;
  const gstPercent = toStoredAmount(stored?.gstPercent) || defaultGstPercent;
  const fallbackPrice = getFallbackItemPrice(
    quote,
    quote.products.length,
    deliveryCharges,
    gstPercent
  );
  const requestItems = quote.products.map((product) =>
    createRequestItem(product, fallbackPrice)
  );
  const storedItems =
    stored?.items
      ?.map((item, index) => {
        const matchingRequestItem = findMatchingRequestItem(requestItems, item);
        const id = readString(item.id) || matchingRequestItem?.id || `custom-${index}`;

        return {
          id,
          locked:
            typeof item.locked === 'boolean'
              ? item.locked
              : Boolean(matchingRequestItem),
          price: toInputValue(item.price),
          productId: readString(item.productId) || matchingRequestItem?.productId || '',
          productName:
            readString(item.productName) || matchingRequestItem?.productName || '',
          quantity: readString(item.quantity) || matchingRequestItem?.quantity || '',
          serviceId:
            readString(item.serviceId) ||
            matchingRequestItem?.serviceId ||
            customServiceId,
          serviceName:
            readString(item.serviceName) ||
            matchingRequestItem?.serviceName ||
            customServiceName
        };
      })
      .filter((item) => item.productName || item.quantity || item.price) ?? [];

  const missingRequestItems = requestItems.filter(
    (requestItem) =>
      !storedItems.some(
        (storedItem) =>
          storedItem.id === requestItem.id ||
          Boolean(storedItem.productId && storedItem.productId === requestItem.productId)
      )
  );

  const items = storedItems.length
    ? [...storedItems, ...missingRequestItems]
    : requestItems;

  return {
    deliveryCharges: String(deliveryCharges),
    gstPercent: String(gstPercent),
    items: items.length ? items : [createBlankItem(0)],
    responseNote:
      quote.responseNote ||
      (typeof stored?.responseNote === 'string' ? stored.responseNote : '') ||
      defaultResponseNote
  };
};

export const createAdminNotes = (values: QuoteFormValues) =>
  JSON.stringify({
    deliveryCharges: toAmount(values.deliveryCharges),
    gstPercent: toAmount(values.gstPercent),
    items: values.items.map((item) => ({
      id: item.id,
      locked: item.locked,
      price: toAmount(item.price),
      productId: item.productId,
      productName: item.productName.trim(),
      quantity: item.quantity.trim(),
      serviceId: item.serviceId,
      serviceName: item.serviceName
    })),
    responseNote: values.responseNote.trim(),
    type: adminQuoteNotesType,
    updatedAt: new Date().toISOString(),
    version: 2
  });

export const groupQuoteItemsByService = (items: QuoteItemValues[]) => {
  const groups = new Map<string, QuoteItemGroup>();

  items.forEach((item, index) => {
    const serviceId = item.serviceId || customServiceId;
    const serviceName = item.serviceName || customServiceName;
    const key = `${serviceId}:${serviceName}`;
    const group =
      groups.get(key) ??
      ({
        items: [],
        serviceId,
        serviceName
      } satisfies QuoteItemGroup);

    group.items.push({ index, item });
    groups.set(key, group);
  });

  return Array.from(groups.values());
};
