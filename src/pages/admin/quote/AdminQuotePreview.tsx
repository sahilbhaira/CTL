import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  documentTextOutline,
  listOutline,
  refreshOutline,
  sendOutline
} from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import AppHeader from '../../../components/header/AppHeader';
import QuoteSuccessModal from '../../../components/quote/QuoteSuccessModal';
import {
  formatIndianCurrency,
  formatQuotationReference,
  getQuotationStatusGroup
} from '../../../lib/quotation';
import { goToPreviousPage } from '../../../lib/navigation';
import {
  useGetAdminQuotationRequestsQuery,
  useUpdateAdminQuotationRequestMutation
} from '../../../services/api/edgeFunctionsApi';
import { useAdminQuotePreviewStore } from '../../../store/adminQuotePreviewStore';
import {
  calculateQuoteTotals,
  createAdminNotes,
  createInitialValues,
  groupQuoteItemsByService
} from './adminQuoteUtils';
import '../admin.css';

interface RouteParams {
  quoteId?: string;
}

const formatQuoteDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));

const AdminQuotePreview: React.FC = () => {
  const history = useHistory();
  const { quoteId } = useParams<RouteParams>();
  const { data, error, isFetching, refetch } = useGetAdminQuotationRequestsQuery({
    limit: 100
  });
  const [updateQuote, { isLoading: isSending }] = useUpdateAdminQuotationRequestMutation();
  const previewQuoteId = useAdminQuotePreviewStore((state) => state.quoteId);
  const previewValues = useAdminQuotePreviewStore((state) => state.values);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(
    null
  );
  const [isSentModalOpen, setIsSentModalOpen] = useState(false);
  const clearPreview = useAdminQuotePreviewStore((state) => state.clearPreview);
  const quote = useMemo(
    () => data?.quotes.find((item) => item.id === quoteId),
    [data?.quotes, quoteId]
  );
  const quoteStatusGroup = quote ? getQuotationStatusGroup(quote.status) : null;
  const isReadOnlyPreview = quoteStatusGroup === 'accepted' || quoteStatusGroup === 'sent';
  const values = useMemo(() => {
    if (quote && !isReadOnlyPreview && previewQuoteId === quote.id && previewValues) {
      return previewValues;
    }

    return createInitialValues(quote);
  }, [isReadOnlyPreview, previewQuoteId, previewValues, quote]);
  const totals = calculateQuoteTotals(values);
  const groupedItems = groupQuoteItemsByService(values.items);

  const goToRespondedInquiries = useCallback(() => {
    setIsSentModalOpen(false);
    history.replace('/admin/inquiries?status=sent');
  }, [history]);

  useEffect(() => {
    if (!isSentModalOpen) {
      return undefined;
    }

    const timerId = window.setTimeout(goToRespondedInquiries, 3000);

    return () => window.clearTimeout(timerId);
  }, [goToRespondedInquiries, isSentModalOpen]);

  const sendQuotation = async () => {
    if (!quote || isReadOnlyPreview) {
      return;
    }

    setMessage(null);

    try {
      await updateQuote({
        adminNotes: createAdminNotes(values),
        id: quote.id,
        quoteAmount: totals.total,
        responseNote: values.responseNote.trim(),
        status: 'sent'
      }).unwrap();

      clearPreview();
      setIsSentModalOpen(true);
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
          <p>Preview data is loaded from the admin Edge Function.</p>
          <button className="ctl-admin-primary-action" onClick={() => refetch()} type="button">
            <IonIcon icon={refreshOutline} />
            Retry
          </button>
        </section>
      );
    }

    if (!quote) {
      return (
        <section className="ctl-admin-empty ctl-admin-preview-empty">
          <div className="ctl-admin-empty__icon">
            <IonIcon icon={documentTextOutline} />
          </div>
          <h2>No quote selected</h2>
          <p>Open an inquiry first, then preview the quotation.</p>
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
      <>
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
                <small>Date: {formatQuoteDate(new Date().toISOString())}</small>
              </div>
            </header>

            <section className="ctl-admin-quote-customer">
              <span>Quotation For:</span>
              <strong>{quote.customer.name}</strong>
              <small>{quote.customer.email}</small>
            </section>

            <section className="ctl-admin-quote-table">
              <div className="ctl-admin-quote-table__head">
                <span>Product</span>
                <span>Qty</span>
                <span>Price</span>
              </div>

              {groupedItems.map((group) => (
                <div className="ctl-admin-quote-table__group" key={`${group.serviceId}:${group.serviceName}`}>
                  <div className="ctl-admin-quote-table__service">
                    <span>Service</span>
                    <strong>{group.serviceName}</strong>
                  </div>

                  {group.items.map(({ item }) => (
                    <div className="ctl-admin-quote-table__row" key={item.id}>
                      <div>
                        <strong>{item.productName}</strong>
                        <small>{group.serviceName}</small>
                      </div>
                      <span>{item.quantity}</span>
                      <strong>{formatIndianCurrency(Number(item.price || 0))}</strong>
                    </div>
                  ))}
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
                <span>GST ({totals.gstRate}%)</span>
                <strong>{formatIndianCurrency(totals.gst)}</strong>
              </div>
            </section>

            <section className="ctl-admin-quote-total">
              <span>Total Amount</span>
              <strong>{formatIndianCurrency(totals.total)}</strong>
            </section>

            <section className="ctl-admin-quote-note">
              <span>Notes</span>
              <p>{values.responseNote}</p>
            </section>
          </article>

          {message ? (
            <p className={`ctl-admin-form-message ctl-admin-form-message--${message.type}`}>
              {message.text}
            </p>
          ) : null}
        </section>

        {!isReadOnlyPreview ? (
          <section className="ctl-admin-preview-actions">
            <button
              className="ctl-admin-primary-action ctl-admin-primary-action--full"
              disabled={isSending}
              onClick={sendQuotation}
              type="button"
            >
              <IonIcon icon={sendOutline} />
              {isSending ? 'SENDING...' : 'SEND TO CUSTOMER'}
            </button>
          </section>
        ) : null}
      </>
    );
  };

  return (
    <IonPage>
      <AppHeader
        brandLeading="back"
        onBack={() => goToPreviousPage(history)}
        title="Quote Preview"
        variant="brand"
      />
      <IonContent className="ctl-admin-content" fullscreen>
        <main className="ctl-admin-page ctl-admin-preview-page">
          {renderContent()}
        </main>
      </IonContent>
      <QuoteSuccessModal
        actionIcon={listOutline}
        actionLabel="GO TO INQUIRIES"
        closeLabel="Close quotation sent"
        description="The quotation has been sent to the customer successfully."
        isOpen={isSentModalOpen}
        onClose={goToRespondedInquiries}
        onGoToQuotes={goToRespondedInquiries}
        referenceId={quote ? formatQuotationReference(quote.id) : null}
        referenceLabel="Quote ID"
        title="Quotation Sent"
      />
    </IonPage>
  );
};

export default AdminQuotePreview;
