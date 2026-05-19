import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  documentTextOutline,
  informationCircleOutline,
  listOutline,
  pricetagOutline,
  refreshOutline,
  sendOutline,
  timeOutline
} from 'ionicons/icons';
import { useFormik } from 'formik';
import { useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import AppHeader from '../../components/header/AppHeader';
import { goToPreviousPage } from '../../lib/navigation';
import {
  formatIndianCurrency,
  formatQuotationReference
} from '../../lib/quotation';
import {
  useFetchEdgeFunctionQuery,
  useRespondToMyQuotationRequestMutation
} from '../../services/api/edgeFunctionsApi';
import { useAuthStore } from '../../store/authStore';
import './quotes.css';

interface RouteParams {
  quoteId: string;
}

interface QuoteRequest {
  id: string;
  quoteAmount: number | string | null;
  responseNote: string | null;
  status: string;
}

interface QuotesResponse {
  quotes?: QuoteRequest[];
}

interface NegotiationValues {
  offerAmount: string;
  responseNote: string;
}

const parseAmount = (value: string) => Number(value.replace(/[₹,\s]/g, ''));

const NegotiateQuote: React.FC = () => {
  const history = useHistory();
  const { quoteId } = useParams<RouteParams>();
  const user = useAuthStore((state) => state.user);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [respondToQuote, { isLoading: isSending }] = useRespondToMyQuotationRequestMutation();
  const {
    data,
    error,
    isFetching,
    refetch
  } = useFetchEdgeFunctionQuery(
    {
      functionName: 'my-quotation-requests',
      method: 'GET'
    },
    {
      skip: !user
    }
  );
  const quote = useMemo(
    () =>
      ((data as QuotesResponse | undefined)?.quotes ?? []).find(
        (quoteItem) => quoteItem.id === quoteId
      ),
    [data, quoteId]
  );

  const formik = useFormik<NegotiationValues>({
    initialValues: {
      offerAmount: '',
      responseNote: ''
    },
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      if (!quote) {
        return;
      }

      try {
        await respondToQuote({
          action: 'negotiate',
          customerOfferAmount: parseAmount(values.offerAmount),
          id: quote.id,
          responseNote: values.responseNote.trim()
        }).unwrap();

        setIsSuccessOpen(true);
      } catch {
        helpers.setStatus({
          text: 'Unable to send negotiation request right now.',
          type: 'error'
        });
      }
    },
    validate: (values) => {
      const errors: Partial<NegotiationValues> = {};
      const amount = parseAmount(values.offerAmount);

      if (!values.offerAmount.trim()) {
        errors.offerAmount = 'Offer amount is required';
      } else if (!Number.isFinite(amount) || amount <= 0) {
        errors.offerAmount = 'Enter a valid offer amount';
      }

      if (!values.responseNote.trim()) {
        errors.responseNote = 'Message is required';
      }

      return errors;
    }
  });
  const submitMessage = formik.status as { text: string; type: 'error' | 'success' } | null;

  const renderContent = () => {
    if (!user) {
      return (
        <section className="ctl-quotes-empty">
          <div className="ctl-quotes-empty__icon">
            <IonIcon icon={documentTextOutline} />
          </div>
          <h2>Login required</h2>
          <p>Please login to negotiate this quotation.</p>
          <button
            className="ctl-quotes-action ctl-quotes-action--primary"
            onClick={() => history.push('/login')}
            type="button"
          >
            Login
          </button>
        </section>
      );
    }

    if (isFetching) {
      return (
        <section className="ctl-quotes-list" aria-label="Loading quote">
          <article className="ctl-quote-card ctl-quote-card--loading">
            <span />
            <span />
            <span />
          </article>
        </section>
      );
    }

    if (error) {
      return (
        <section className="ctl-quotes-empty">
          <div className="ctl-quotes-empty__icon ctl-quotes-empty__icon--error">
            <IonIcon icon={documentTextOutline} />
          </div>
          <h2>Unable to load quote</h2>
          <p>Please check your connection and try again.</p>
          <button
            className="ctl-quotes-action ctl-quotes-action--primary"
            onClick={() => refetch()}
            type="button"
          >
            <IonIcon icon={refreshOutline} />
            Retry
          </button>
        </section>
      );
    }

    if (!quote?.quoteAmount || ['accepted', 'closed'].includes(quote.status)) {
      return (
        <section className="ctl-quotes-empty">
          <div className="ctl-quotes-empty__icon">
            <IonIcon icon={documentTextOutline} />
          </div>
          <h2>Negotiation unavailable</h2>
          <p>This quotation is not ready for negotiation right now.</p>
          <button
            className="ctl-quotes-action ctl-quotes-action--primary"
            onClick={() => history.push('/quotes')}
            type="button"
          >
            Track
          </button>
        </section>
      );
    }

    return (
      <form className="ctl-negotiate-form" noValidate onSubmit={formik.handleSubmit}>
        <section className="ctl-negotiate-price-card">
          <div>
            <span>Current Quoted Price</span>
            <strong>{formatIndianCurrency(quote.quoteAmount)}</strong>
          </div>
          <em>
            <IonIcon icon={pricetagOutline} />
          </em>
        </section>

        <label className="ctl-negotiate-field">
          <span>Your Offer</span>
          <div className="ctl-negotiate-money-input">
            <em>₹</em>
            <input
              inputMode="decimal"
              name="offerAmount"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              placeholder="Enter your proposed amount"
              value={formik.values.offerAmount}
            />
          </div>
          {formik.touched.offerAmount && formik.errors.offerAmount ? (
            <small>{formik.errors.offerAmount}</small>
          ) : null}
        </label>

        <label className="ctl-negotiate-field">
          <span>Message</span>
          <textarea
            name="responseNote"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            placeholder="Explain your reasoning or add any specific requests..."
            value={formik.values.responseNote}
          />
          {formik.touched.responseNote && formik.errors.responseNote ? (
            <small>{formik.errors.responseNote}</small>
          ) : null}
        </label>

        {submitMessage ? (
          <p className={`ctl-quotes-message ctl-quotes-message--${submitMessage.type}`}>
            {submitMessage.text}
          </p>
        ) : null}

        <button
          className="ctl-negotiate-submit"
          disabled={formik.isSubmitting || isSending}
          type="submit"
        >
          <IonIcon icon={sendOutline} />
          {formik.isSubmitting || isSending ? 'SENDING...' : 'SEND REQUEST'}
        </button>
      </form>
    );
  };

  return (
    <IonPage>
      <AppHeader
        brandLeading="back"
        brandTrailing="user"
        onBack={() => goToPreviousPage(history)}
        onProfile={() => history.push('/profile')}
        title="Negotiate Quote"
        variant="brand"
      />
      <IonContent className="ctl-account-content" fullscreen>
        <main className="ctl-account ctl-negotiate">
          <section className="ctl-account-title ctl-negotiate-title">
            <h1>Negotiate Quote</h1>
            <p>
              Propose your offer and send a message regarding Quote{' '}
              {formatQuotationReference(quote?.id ?? quoteId)}.
            </p>
          </section>

          {renderContent()}
        </main>
      </IonContent>

      {isSuccessOpen ? (
        <div className="ctl-negotiate-success" role="dialog" aria-modal="true">
          <section className="ctl-negotiate-success__card">
            <div className="ctl-negotiate-success__icon">
              <IonIcon icon={timeOutline} />
            </div>
            <h2>Offer Sent!</h2>
            <p>Your negotiation request has been submitted successfully.</p>

            <div className="ctl-negotiate-success__summary">
              <div>
                <span>Reference ID</span>
                <strong>{formatQuotationReference(quote?.id ?? quoteId)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Negotiating</strong>
              </div>
            </div>

            <div className="ctl-negotiate-success__info">
              <IonIcon icon={informationCircleOutline} />
              <span>Waiting for admin response. We will notify you once reviewed.</span>
            </div>

            <button
              className="ctl-negotiate-submit"
              onClick={() => history.push('/quotes')}
              type="button"
            >
              <IonIcon icon={listOutline} />
              GO TO TRACK
            </button>
          </section>
        </div>
      ) : null}
    </IonPage>
  );
};

export default NegotiateQuote;
