import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  arrowBackOutline,
  documentTextOutline,
  refreshOutline,
  sendOutline
} from 'ionicons/icons';
import { useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import {
  formatIndianCurrency,
  formatQuotationReference,
  getQuotationStatusGroup
} from '../../lib/quotation';
import {
  type AdminQuotationRequest,
  useGetAdminQuotationRequestsQuery,
  useUpdateAdminQuotationRequestMutation
} from '../../services/api/edgeFunctionsApi';
import './admin.css';

interface RouteParams {
  quoteId?: string;
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));

const toAmount = (value: number | string | null | undefined) => {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const getPreviewTotal = (quote: AdminQuotationRequest) => {
  const quotedAmount = toAmount(quote.quoteAmount);
  const customerOffer = toAmount(quote.customerOfferAmount);

  if (quotedAmount) {
    return quotedAmount;
  }

  if (customerOffer) {
    return customerOffer;
  }

  return Math.max(quote.products.length, 1) * 48616;
};

const getPreviewBreakdown = (total: number) => {
  const delivery = Math.max(Math.round(total * 0.025), 1200);
  const taxable = Math.max(total - delivery, 0);
  const subtotal = Math.round(taxable / 1.18);
  const gst = Math.max(total - delivery - subtotal, 0);

  return {
    delivery,
    gst,
    subtotal,
    total
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

const AdminQuotePreview: React.FC = () => {
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
  const totals = quote ? getPreviewBreakdown(getPreviewTotal(quote)) : null;
  const itemPrice = totals && quote?.products.length
    ? Math.round(totals.subtotal / quote.products.length)
    : 0;
  const note =
    quote?.responseNote ||
    'Price valid for 48 hours. Delivery within 2-3 business days after confirmation.';

  const handleBack = () => {
    if (history.length > 1) {
      history.goBack();
      return;
    }

    history.push('/admin/leads');
  };

  const handleSend = async () => {
    if (!quote || !totals) {
      return;
    }

    setMessage(null);

    try {
      await updateQuote({
        id: quote.id,
        quoteAmount: totals.total,
        responseNote: note,
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
  };

  const renderContent = () => {
    if (isFetching) {
      return (
        <section className="ctl-admin-preview-body">
          <article className="ctl-admin-skeleton ctl-admin-skeleton--large" />
        </section>
      );
    }

    if (error) {
      return (
        <section className="ctl-admin-empty ctl-admin-preview-empty">
          <h2>Unable to load quote preview</h2>
          <p>Quote preview data is loaded from the admin Edge Function.</p>
          <button className="ctl-admin-primary-action" onClick={() => refetch()} type="button">
            <IonIcon icon={refreshOutline} />
            Retry
          </button>
        </section>
      );
    }

    if (!quote || !totals) {
      return (
        <section className="ctl-admin-empty ctl-admin-preview-empty">
          <div className="ctl-admin-empty__icon">
            <IonIcon icon={documentTextOutline} />
          </div>
          <h2>No quote ready</h2>
          <p>Create a customer quotation request first, then come back to preview it.</p>
          <button
            className="ctl-admin-primary-action"
            onClick={() => history.push('/admin/leads')}
            type="button"
          >
            View Leads
          </button>
        </section>
      );
    }

    return (
      <section className="ctl-admin-preview-body">
        <article className="ctl-admin-quote-document">
          <div className="ctl-admin-quote-band" />

          <header className="ctl-admin-quote-document__header">
            <div>
              <div className="ctl-admin-quote-brand">
                <span>CTL</span>
                <strong>Chandigarh Trade Link</strong>
              </div>
              <em>Official Quotation</em>
            </div>
            <div className="ctl-admin-quote-meta">
              <span>Quote ID</span>
              <strong>{formatQuotationReference(quote.id)}</strong>
              <small>Date: {formatDate(quote.updatedAt)}</small>
            </div>
          </header>

          <section className="ctl-admin-quote-customer">
            <span>Quotation For:</span>
            <strong>{quote.customer.name}</strong>
            <small>{quote.customer.email}</small>
          </section>

          <section className="ctl-admin-quote-table" aria-label="Quotation items">
            <div className="ctl-admin-quote-table__head">
              <span>Product</span>
              <span>Qty</span>
              <span>Price</span>
            </div>

            {quote.products.map((product) => (
              <div className="ctl-admin-quote-table__row" key={product.id}>
                <div>
                  <strong>{product.productName}</strong>
                  <small>{product.serviceName}</small>
                </div>
                <span>{product.quantity}</span>
                <strong>{formatIndianCurrency(itemPrice)}</strong>
              </div>
            ))}
          </section>

          <section className="ctl-admin-quote-totals">
            <div>
              <span>Subtotal</span>
              <strong>{formatIndianCurrency(totals.subtotal)}</strong>
            </div>
            <div>
              <span>Delivery Charges</span>
              <strong>{formatIndianCurrency(totals.delivery)}</strong>
            </div>
            <div>
              <span>GST (18%)</span>
              <strong>{formatIndianCurrency(totals.gst)}</strong>
            </div>
          </section>

          <footer className="ctl-admin-quote-total">
            <span>Total Amount</span>
            <strong>{formatIndianCurrency(totals.total)}</strong>
          </footer>

          <section className="ctl-admin-quote-note">
            <span>Notes</span>
            <p>{note}</p>
          </section>
        </article>

        {message ? (
          <p className={`ctl-admin-form-message ctl-admin-form-message--${message.type}`}>
            {message.text}
          </p>
        ) : null}
      </section>
    );
  };

  return (
    <IonPage>
      <header className="ctl-admin-preview-header">
        <IonButton
          aria-label="Go back"
          className="ctl-admin-preview-back"
          fill="clear"
          onClick={handleBack}
        >
          <IonIcon icon={arrowBackOutline} slot="icon-only" />
        </IonButton>
        <h1>Quote Preview</h1>
      </header>

      <IonContent className="ctl-admin-content" fullscreen>
        <main className="ctl-admin-page ctl-admin-preview-page">
          {renderContent()}
        </main>
      </IonContent>

      <div className="ctl-admin-preview-actions">
        <button
          className="ctl-admin-primary-action ctl-admin-primary-action--full"
          disabled={!quote || isSending}
          onClick={handleSend}
          type="button"
        >
          <IonIcon icon={sendOutline} />
          {isSending ? 'SENDING...' : 'SEND TO CUSTOMER'}
        </button>
      </div>
    </IonPage>
  );
};

export default AdminQuotePreview;

