import { IonIcon } from '@ionic/react';
import {
  chatbubbleEllipsesOutline,
  documentTextOutline,
  refreshOutline
} from 'ionicons/icons';
import { useFormik } from 'formik';
import { useMemo } from 'react';
import { useHistory, useParams } from 'react-router';
import AdminLeadCard from '../../components/admin/AdminLeadCard';
import AdminPageShell from '../../components/admin/AdminPageShell';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import {
  formatIndianCurrency,
  formatQuotationReference,
  getQuotationStatusGroup
} from '../../lib/quotation';
import {
  useGetAdminQuotationRequestsQuery,
  useUpdateAdminQuotationRequestMutation
} from '../../services/api/edgeFunctionsApi';

interface NegotiationRouteParams {
  quoteId?: string;
}

interface NegotiationValues {
  quoteAmount: string;
  responseNote: string;
}

const parseAmount = (value: string) => Number(value.replace(/,/g, '').trim());

const AdminNegotiations: React.FC = () => {
  const history = useHistory();
  const { quoteId } = useParams<NegotiationRouteParams>();
  const { data, error, isFetching, refetch } = useGetAdminQuotationRequestsQuery({
    limit: 100
  });
  const [updateQuote, { isLoading: isUpdating }] = useUpdateAdminQuotationRequestMutation();
  const quotes = useMemo(() => data?.quotes ?? [], [data?.quotes]);
  const negotiationQuotes = useMemo(
    () =>
      quotes.filter((quote) => getQuotationStatusGroup(quote.status) === 'negotiating'),
    [quotes]
  );
  const selectedQuote = useMemo(
    () => (quoteId ? quotes.find((quote) => quote.id === quoteId) : undefined),
    [quoteId, quotes]
  );
  const isSelectedNegotiating =
    Boolean(selectedQuote) &&
    getQuotationStatusGroup(selectedQuote?.status ?? 'pending') === 'negotiating';

  const formik = useFormik<NegotiationValues>({
    enableReinitialize: true,
    initialValues: {
      quoteAmount: selectedQuote?.quoteAmount ? String(selectedQuote.quoteAmount) : '',
      responseNote:
        selectedQuote?.responseNote ??
        'We have reviewed your request and can update the quotation with our best available price.'
    },
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      if (!selectedQuote || !isSelectedNegotiating) {
        return;
      }

      try {
        await updateQuote({
          id: selectedQuote.id,
          quoteAmount: parseAmount(values.quoteAmount),
          responseNote: values.responseNote,
          status: 'quoted'
        }).unwrap();

        helpers.setStatus({
          text: 'Quotation updated and moved to Sent.',
          type: 'success'
        });
      } catch {
        helpers.setStatus({
          text: 'Unable to update quotation right now.',
          type: 'error'
        });
      }
    },
    validate: (values) => {
      const errors: Partial<NegotiationValues> = {};
      const amount = parseAmount(values.quoteAmount);

      if (!values.quoteAmount.trim()) {
        errors.quoteAmount = 'Quote amount is required';
      } else if (!Number.isFinite(amount) || amount <= 0) {
        errors.quoteAmount = 'Enter a valid quote amount';
      }

      if (!values.responseNote.trim()) {
        errors.responseNote = 'Response note is required';
      }

      return errors;
    }
  });

  const submitMessage = formik.status as { text: string; type: 'error' | 'success' } | null;

  const renderLoading = () => (
    <section className="ctl-admin-list">
      <article className="ctl-admin-skeleton ctl-admin-skeleton--large" />
    </section>
  );

  const renderError = () => (
    <section className="ctl-admin-empty">
      <h2>Unable to load negotiations</h2>
      <p>Counter-offers are loaded through the admin Edge Function.</p>
      <button className="ctl-admin-primary-action" onClick={() => refetch()} type="button">
        <IonIcon icon={refreshOutline} />
        Retry
      </button>
    </section>
  );

  const renderList = () => {
    if (isFetching) {
      return renderLoading();
    }

    if (error) {
      return renderError();
    }

    if (!negotiationQuotes.length) {
      return (
        <section className="ctl-admin-empty">
          <div className="ctl-admin-empty__icon">
            <IonIcon icon={chatbubbleEllipsesOutline} />
          </div>
          <h2>No active negotiations</h2>
          <p>Customer counter-offers will appear here when a quote enters negotiation.</p>
        </section>
      );
    }

    return (
      <section className="ctl-admin-list">
        {negotiationQuotes.map((quote) => (
          <AdminLeadCard
            actionLabel="OPEN NEGOTIATION"
            key={quote.id}
            onAction={() => history.push(`/admin/negotiations/${quote.id}`)}
            quote={quote}
            showAmount
          />
        ))}
      </section>
    );
  };

  const renderDetail = () => {
    if (isFetching) {
      return renderLoading();
    }

    if (error) {
      return renderError();
    }

    if (!selectedQuote) {
      return (
        <section className="ctl-admin-empty">
          <div className="ctl-admin-empty__icon">
            <IonIcon icon={chatbubbleEllipsesOutline} />
          </div>
          <h2>Negotiation not found</h2>
          <p>This negotiation may have been removed or refreshed.</p>
          <button
            className="ctl-admin-primary-action"
            onClick={() => history.replace('/admin/negotiations')}
            type="button"
          >
            View Negotiations
          </button>
        </section>
      );
    }

    if (!isSelectedNegotiating) {
      return (
        <section className="ctl-admin-empty">
          <div className="ctl-admin-empty__icon">
            <IonIcon icon={documentTextOutline} />
          </div>
          <h2>Negotiation already closed</h2>
          <p>This quote has moved out of negotiations.</p>
          <button
            className="ctl-admin-primary-action"
            onClick={() => history.replace('/admin/inquiries?status=sent')}
            type="button"
          >
            View Responded
          </button>
        </section>
      );
    }

    return (
      <section className="ctl-admin-content-stack">
        <article className="ctl-admin-negotiation-card">
          <div className="ctl-admin-negotiation-card__top">
            <div>
              <h2>{selectedQuote.customer.name}</h2>
              <span>
                <IonIcon icon={documentTextOutline} />
                {formatQuotationReference(selectedQuote.id)}
              </span>
            </div>
            <AdminStatusBadge status={selectedQuote.status} />
          </div>

          <div className="ctl-admin-price-grid">
            <div>
              <span>Current Quote</span>
              <strong>{formatIndianCurrency(selectedQuote.quoteAmount)}</strong>
            </div>
            <div className="ctl-admin-price-grid__highlight">
              <span>Customer Offer</span>
              <strong>{formatIndianCurrency(selectedQuote.customerOfferAmount)}</strong>
            </div>
          </div>

          <div className="ctl-admin-customer-message">
            <span>Customer Message</span>
            <p>
              {selectedQuote.customerResponseNote ||
                selectedQuote.notes ||
                'No customer message was added.'}
            </p>
          </div>
        </article>

        <form className="ctl-admin-form" noValidate onSubmit={formik.handleSubmit}>
          <h3>Update Quote</h3>

          <label className="ctl-admin-field">
            <span>New Quote Amount</span>
            <div className="ctl-admin-money-input">
              <em>₹</em>
              <input
                inputMode="decimal"
                name="quoteAmount"
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                placeholder="45,000"
                value={formik.values.quoteAmount}
              />
            </div>
            {formik.touched.quoteAmount && formik.errors.quoteAmount ? (
              <small>{formik.errors.quoteAmount}</small>
            ) : null}
          </label>

          <label className="ctl-admin-field">
            <span>Response Note</span>
            <textarea
              name="responseNote"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              value={formik.values.responseNote}
            />
            {formik.touched.responseNote && formik.errors.responseNote ? (
              <small>{formik.errors.responseNote}</small>
            ) : null}
          </label>

          {submitMessage ? (
            <p className={`ctl-admin-form-message ctl-admin-form-message--${submitMessage.type}`}>
              {submitMessage.text}
            </p>
          ) : null}

          <button
            className="ctl-admin-primary-action ctl-admin-primary-action--full"
            disabled={formik.isSubmitting || isUpdating}
            type="submit"
          >
            <IonIcon icon={refreshOutline} />
            {formik.isSubmitting || isUpdating ? 'UPDATING...' : 'UPDATE QUOTATION'}
          </button>
        </form>
      </section>
    );
  };

  const renderContent = () => (quoteId ? renderDetail() : renderList());

  return (
    <AdminPageShell
      activeTab="Inquiries"
      brandLeading="back"
      subtitle={
        quoteId
          ? 'Review the customer counter-offer and update this quote.'
          : 'Review all customer counter-offers.'
      }
      title={quoteId ? 'Negotiation Details' : 'Negotiations'}
    >
      {renderContent()}
    </AdminPageShell>
  );
};

export default AdminNegotiations;
