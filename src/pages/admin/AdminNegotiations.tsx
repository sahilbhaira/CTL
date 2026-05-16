import { IonIcon } from '@ionic/react';
import {
  chatbubbleEllipsesOutline,
  documentTextOutline,
  refreshOutline
} from 'ionicons/icons';
import { useFormik } from 'formik';
import { useMemo } from 'react';
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

interface NegotiationValues {
  quoteAmount: string;
  responseNote: string;
}

const parseAmount = (value: string) => Number(value.replace(/,/g, '').trim());

const AdminNegotiations: React.FC = () => {
  const { data, error, isFetching, refetch } = useGetAdminQuotationRequestsQuery({
    limit: 100
  });
  const [updateQuote, { isLoading: isUpdating }] = useUpdateAdminQuotationRequestMutation();
  const negotiationQuote = useMemo(
    () =>
      (data?.quotes ?? []).find((quote) => getQuotationStatusGroup(quote.status) === 'negotiating'),
    [data?.quotes]
  );

  const formik = useFormik<NegotiationValues>({
    enableReinitialize: true,
    initialValues: {
      quoteAmount: negotiationQuote?.quoteAmount ? String(negotiationQuote.quoteAmount) : '',
      responseNote:
        negotiationQuote?.responseNote ??
        'We have reviewed your request and can update the quotation with our best available price.'
    },
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      if (!negotiationQuote) {
        return;
      }

      try {
        await updateQuote({
          id: negotiationQuote.id,
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

  const renderContent = () => {
    if (isFetching) {
      return (
        <section className="ctl-admin-list">
          <article className="ctl-admin-skeleton ctl-admin-skeleton--large" />
        </section>
      );
    }

    if (error) {
      return (
        <section className="ctl-admin-empty">
          <h2>Unable to load negotiations</h2>
          <p>Counter-offers are loaded through the admin Edge Function.</p>
          <button className="ctl-admin-primary-action" onClick={() => refetch()} type="button">
            <IonIcon icon={refreshOutline} />
            Retry
          </button>
        </section>
      );
    }

    if (!negotiationQuote) {
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
      <section className="ctl-admin-content-stack">
        <article className="ctl-admin-negotiation-card">
          <div className="ctl-admin-negotiation-card__top">
            <div>
              <h2>{negotiationQuote.customer.name}</h2>
              <span>
                <IonIcon icon={documentTextOutline} />
                {formatQuotationReference(negotiationQuote.id)}
              </span>
            </div>
            <AdminStatusBadge status={negotiationQuote.status} />
          </div>

          <div className="ctl-admin-price-grid">
            <div>
              <span>Current Quote</span>
              <strong>{formatIndianCurrency(negotiationQuote.quoteAmount)}</strong>
            </div>
            <div className="ctl-admin-price-grid__highlight">
              <span>Customer Offer</span>
              <strong>{formatIndianCurrency(negotiationQuote.customerOfferAmount)}</strong>
            </div>
          </div>

          <div className="ctl-admin-customer-message">
            <span>Customer Message</span>
            <p>
              {negotiationQuote.customerResponseNote ||
                negotiationQuote.notes ||
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

  return (
    <AdminPageShell
      activeTab="Inquiries"
      brandLeading="back"
      subtitle="Review customer counter-offers and update quotes."
      title="Negotiations"
    >
      {renderContent()}
    </AdminPageShell>
  );
};

export default AdminNegotiations;
