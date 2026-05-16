import { IonIcon } from '@ionic/react';
import {
  addOutline,
  documentTextOutline,
  receiptOutline,
  refreshOutline,
  sendOutline,
  trashOutline
} from 'ionicons/icons';
import { getIn, useFormik } from 'formik';
import { useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import AdminPageShell from '../../../components/admin/AdminPageShell';
import {
  formatIndianCurrency,
  formatQuotationReference,
  getQuotationStatusGroup
} from '../../../lib/quotation';
import {
  type AdminQuotationRequest,
  useGetAdminQuotationRequestsQuery,
  useUpdateAdminQuotationRequestMutation
} from '../../../services/api/edgeFunctionsApi';
import '../admin.css';

interface RouteParams {
  quoteId?: string;
}

interface QuoteItemValues {
  id: string;
  price: string;
  productName: string;
  quantity: string;
}

interface QuoteFormValues {
  deliveryCharges: string;
  gstPercent: string;
  items: QuoteItemValues[];
  responseNote: string;
}

interface StoredQuoteItem {
  id?: unknown;
  price?: unknown;
  productName?: unknown;
  quantity?: unknown;
}

interface StoredQuoteBreakdown {
  deliveryCharges?: unknown;
  gstPercent?: unknown;
  items?: StoredQuoteItem[];
  responseNote?: unknown;
  type?: unknown;
}

const adminQuoteNotesType = 'ctl-admin-quote';
const defaultDeliveryCharges = 0;
const defaultGstPercent = 18;
const defaultResponseNote =
  'Delivery within 2-3 business days. Please review the quote and confirm to proceed.';

const createBlankItem = (id: number | string): QuoteItemValues => ({
  id: `custom-${id}`,
  price: '',
  productName: '',
  quantity: ''
});

const parseNumberInput = (value: number | string | null | undefined) => {
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

const toAmount = (value: number | string | null | undefined) => {
  const amount = parseNumberInput(value);
  return amount && amount > 0 ? amount : 0;
};

const toStoredAmount = (value: unknown) =>
  toAmount(value as number | string | null | undefined);

const toInputValue = (value: unknown, fallback = '') => {
  const amount = parseNumberInput(value as number | string | null | undefined);
  return amount !== null ? String(amount) : fallback;
};

const parseStoredQuoteBreakdown = (adminNotes: string | null) => {
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

const calculateQuoteTotals = (values: QuoteFormValues) => {
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

const createInitialValues = (quote: AdminQuotationRequest | undefined): QuoteFormValues => {
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
  const storedItems =
    stored?.items
      ?.map((item, index) => ({
        id: String(item.id ?? `custom-${index}`),
        price: toInputValue(item.price),
        productName: typeof item.productName === 'string' ? item.productName : '',
        quantity: typeof item.quantity === 'string' ? item.quantity : ''
      }))
      .filter((item) => item.productName || item.quantity || item.price) ?? [];

  const fallbackPrice = getFallbackItemPrice(
    quote,
    quote.products.length,
    deliveryCharges,
    gstPercent
  );
  const requestItems = quote.products.map((product) => ({
    id: product.id,
    price: fallbackPrice,
    productName: product.productName,
    quantity: product.quantity
  }));

  let items = storedItems;

  if (!items.length) {
    items = requestItems.length ? requestItems : [createBlankItem(0)];
  }

  return {
    deliveryCharges: String(deliveryCharges),
    gstPercent: String(gstPercent),
    items,
    responseNote:
      quote.responseNote ||
      (typeof stored?.responseNote === 'string' ? stored.responseNote : '') ||
      defaultResponseNote
  };
};

const getTargetQuote = (
  quotes: AdminQuotationRequest[],
  quoteId: string | undefined
) => {
  if (quoteId) {
    return quotes.find((quote) => quote.id === quoteId);
  }

  return (
    quotes.find((quote) => getQuotationStatusGroup(quote.status) === 'pending') ??
    quotes.find((quote) => getQuotationStatusGroup(quote.status) === 'negotiating') ??
    quotes[0]
  );
};

const createAdminNotes = (values: QuoteFormValues) =>
  JSON.stringify({
    deliveryCharges: toAmount(values.deliveryCharges),
    gstPercent: toAmount(values.gstPercent),
    items: values.items.map((item) => ({
      id: item.id,
      price: toAmount(item.price),
      productName: item.productName.trim(),
      quantity: item.quantity.trim()
    })),
    responseNote: values.responseNote.trim(),
    type: adminQuoteNotesType,
    updatedAt: new Date().toISOString(),
    version: 1
  });

const AdminQuote: React.FC = () => {
  const history = useHistory();
  const { quoteId } = useParams<RouteParams>();
  const { data, error, isFetching, refetch } = useGetAdminQuotationRequestsQuery({
    limit: 100
  });
  const [updateQuote, { isLoading: isSending }] = useUpdateAdminQuotationRequestMutation();
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(
    null
  );
  const quote = useMemo(
    () => getTargetQuote(data?.quotes ?? [], quoteId),
    [data?.quotes, quoteId]
  );
  const initialValues = useMemo(() => createInitialValues(quote), [quote]);

  const formik = useFormik<QuoteFormValues>({
    enableReinitialize: true,
    initialValues,
    onSubmit: async (values) => {
      if (!quote) {
        return;
      }

      const totals = calculateQuoteTotals(values);
      setMessage(null);

      try {
        await updateQuote({
          adminNotes: createAdminNotes(values),
          id: quote.id,
          quoteAmount: totals.total,
          responseNote: values.responseNote.trim(),
          status: 'sent'
        }).unwrap();

        setMessage({
          text: 'Quotation sent to customer.',
          type: 'success'
        });
      } catch {
        setMessage({
          text: 'Unable to send quotation right now.',
          type: 'error'
        });
      }
    },
    validate: (values) => {
      const errors: Record<string, unknown> = {};
      const itemErrors = values.items.map((item) => {
        const nextErrors: Partial<QuoteItemValues> = {};

        if (!item.productName.trim()) {
          nextErrors.productName = 'Product name is required';
        }

        if (!item.quantity.trim()) {
          nextErrors.quantity = 'Quantity is required';
        }

        if (!toAmount(item.price)) {
          nextErrors.price = 'Enter a valid price';
        }

        return nextErrors;
      });

      if (itemErrors.some((item) => Object.keys(item).length)) {
        errors.items = itemErrors;
      }

      const deliveryAmount = parseNumberInput(values.deliveryCharges);
      const gstPercent = parseNumberInput(values.gstPercent);

      if (deliveryAmount === null || deliveryAmount < 0) {
        errors.deliveryCharges = 'Enter valid delivery charges';
      }

      if (gstPercent === null || gstPercent < 0) {
        errors.gstPercent = 'Enter valid GST';
      }

      if (!values.responseNote.trim()) {
        errors.responseNote = 'Notes are required';
      }

      return errors;
    }
  });

  const totals = calculateQuoteTotals(formik.values);

  const getFieldError = (name: string) => {
    const error = getIn(formik.errors, name);
    const touched = getIn(formik.touched, name);
    return touched && typeof error === 'string' ? error : null;
  };

  const addItem = () => {
    void formik.setFieldValue('items', [
      ...formik.values.items,
      createBlankItem(Date.now())
    ]);
  };

  const removeItem = (index: number) => {
    const nextItems = formik.values.items.filter((_, itemIndex) => itemIndex !== index);
    void formik.setFieldValue('items', nextItems.length ? nextItems : [createBlankItem(Date.now())]);
  };

  const renderContent = () => {
    if (isFetching) {
      return (
        <section className="ctl-admin-content-stack">
          <article className="ctl-admin-skeleton ctl-admin-skeleton--large" />
        </section>
      );
    }

    if (error) {
      return (
        <section className="ctl-admin-empty">
          <h2>Unable to load quote</h2>
          <p>Quote data is loaded from the admin Edge Function.</p>
          <button className="ctl-admin-primary-action" onClick={() => refetch()} type="button">
            <IonIcon icon={refreshOutline} />
            Retry
          </button>
        </section>
      );
    }

    if (!quote) {
      return (
        <section className="ctl-admin-empty">
          <div className="ctl-admin-empty__icon">
            <IonIcon icon={documentTextOutline} />
          </div>
          <h2>No inquiry selected</h2>
          <p>Open an inquiry first, then create the customer quotation.</p>
          <button
            className="ctl-admin-primary-action"
            onClick={() => history.push('/admin/inquiries')}
            type="button"
          >
            View Inquiries
          </button>
        </section>
      );
    }

    return (
      <form
        className="ctl-admin-content-stack ctl-admin-create-quote"
        noValidate
        onSubmit={formik.handleSubmit}
      >
        <section className="ctl-admin-quote-context">
          <span>Inquiry Reference</span>
          <div>
            <strong>{quote.customer.name}</strong>
            <em>{formatQuotationReference(quote.id)}</em>
          </div>
        </section>

        <section className="ctl-admin-quote-form-section">
          <h3>Quote Items</h3>

          {formik.values.items.map((item, index) => (
            <article className="ctl-admin-quote-item" key={item.id}>
              <button
                aria-label="Remove quote item"
                className="ctl-admin-quote-remove"
                onClick={() => removeItem(index)}
                type="button"
              >
                <IonIcon icon={trashOutline} />
              </button>

              <label className="ctl-admin-quote-field ctl-admin-quote-field--wide">
                <span>Product Name</span>
                <input
                  name={`items.${index}.productName`}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  placeholder="Product name"
                  value={item.productName}
                />
                {getFieldError(`items.${index}.productName`) ? (
                  <small>{getFieldError(`items.${index}.productName`)}</small>
                ) : null}
              </label>

              <div className="ctl-admin-quote-row">
                <label className="ctl-admin-quote-field">
                  <span>Quantity</span>
                  <input
                    name={`items.${index}.quantity`}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    placeholder="50 bags"
                    value={item.quantity}
                  />
                  {getFieldError(`items.${index}.quantity`) ? (
                    <small>{getFieldError(`items.${index}.quantity`)}</small>
                  ) : null}
                </label>

                <label className="ctl-admin-quote-field">
                  <span>Price</span>
                  <div className="ctl-admin-quote-money">
                    <em>₹</em>
                    <input
                      inputMode="decimal"
                      name={`items.${index}.price`}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      placeholder="0"
                      value={item.price}
                    />
                  </div>
                  {getFieldError(`items.${index}.price`) ? (
                    <small>{getFieldError(`items.${index}.price`)}</small>
                  ) : null}
                </label>
              </div>
            </article>
          ))}

          <button className="ctl-admin-add-item" onClick={addItem} type="button">
            <IonIcon icon={addOutline} />
            ADD ITEM
          </button>
        </section>

        <section className="ctl-admin-quote-form-section">
          <h3>Additional Charges</h3>
          <div className="ctl-admin-quote-row">
            <label className="ctl-admin-quote-field">
              <span>Delivery Charges</span>
              <div className="ctl-admin-quote-money">
                <em>₹</em>
                <input
                  inputMode="decimal"
                  name="deliveryCharges"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  value={formik.values.deliveryCharges}
                />
              </div>
              {getFieldError('deliveryCharges') ? (
                <small>{getFieldError('deliveryCharges')}</small>
              ) : null}
            </label>

            <label className="ctl-admin-quote-field">
              <span>GST (%)</span>
              <div className="ctl-admin-quote-money ctl-admin-quote-money--suffix">
                <input
                  inputMode="decimal"
                  name="gstPercent"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  value={formik.values.gstPercent}
                />
                <em>%</em>
              </div>
              {getFieldError('gstPercent') ? <small>{getFieldError('gstPercent')}</small> : null}
            </label>
          </div>
        </section>

        <label className="ctl-admin-quote-field ctl-admin-quote-field--wide">
          <span>Notes to Customer</span>
          <textarea
            name="responseNote"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            value={formik.values.responseNote}
          />
          {getFieldError('responseNote') ? <small>{getFieldError('responseNote')}</small> : null}
        </label>

        <section className="ctl-admin-quote-total-card">
          <div>
            <span>Total Quote</span>
            <strong>{formatIndianCurrency(totals.total)}</strong>
          </div>
          <em>
            <IonIcon icon={receiptOutline} />
          </em>
        </section>

        <section className="ctl-admin-quote-breakdown">
          <div>
            <span>Subtotal</span>
            <strong>{formatIndianCurrency(totals.subtotal)}</strong>
          </div>
          <div>
            <span>Delivery</span>
            <strong>{formatIndianCurrency(totals.delivery)}</strong>
          </div>
          <div>
            <span>GST ({totals.gstRate}%)</span>
            <strong>{formatIndianCurrency(totals.gst)}</strong>
          </div>
        </section>

        {message ? (
          <p className={`ctl-admin-form-message ctl-admin-form-message--${message.type}`}>
            {message.text}
          </p>
        ) : null}

        <section className="ctl-admin-quote-actions">
          <button
            className="ctl-admin-secondary-action ctl-admin-primary-action--full"
            onClick={() => window.print()}
            type="button"
          >
            <IonIcon icon={documentTextOutline} />
            PREVIEW PDF
          </button>
          <button
            className="ctl-admin-primary-action ctl-admin-primary-action--full"
            disabled={formik.isSubmitting || isSending}
            type="submit"
          >
            <IonIcon icon={sendOutline} />
            {formik.isSubmitting || isSending ? 'SENDING...' : 'SEND QUOTATION'}
          </button>
        </section>
      </form>
    );
  };

  return (
    <AdminPageShell
      activeTab="Inquiries"
      brandLeading="back"
      subtitle="Generate a formal quotation for the customer."
      title="Create Quote"
    >
      {renderContent()}
    </AdminPageShell>
  );
};

export default AdminQuote;
