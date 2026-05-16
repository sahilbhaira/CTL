import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  addCircleOutline,
  alertCircleOutline,
  chatbubbleEllipsesOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  cubeOutline,
  documentTextOutline,
  logInOutline,
  personAddOutline,
  receiptOutline,
  refreshOutline,
  timeOutline
} from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router';
import AppHeader from '../../components/header/AppHeader';
import {
  formatIndianCurrency,
  formatQuotationReference,
  formatQuotationStatus
} from '../../lib/quotation';
import {
  useFetchEdgeFunctionQuery,
  useRespondToMyQuotationRequestMutation
} from '../../services/api/edgeFunctionsApi';
import { useAuthStore } from '../../store/authStore';
import './quotes.css';

interface QuoteProduct {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  serviceId: string;
  serviceName: string;
}

interface QuoteDetailsItem {
  id: string;
  price: number | null;
  productName: string;
  quantity: string;
}

interface QuoteDetails {
  deliveryCharges: number | null;
  gstPercent: number | null;
  items: QuoteDetailsItem[];
  responseNote: string | null;
}

interface QuoteRequest {
  acceptedAt: string | null;
  createdAt: string;
  customerOfferAmount: number | string | null;
  customerRespondedAt: string | null;
  customerResponseNote: string | null;
  id: string;
  notes: string | null;
  products: QuoteProduct[];
  quoteAmount: number | string | null;
  quoteDetails: QuoteDetails | null;
  quotedAt: string | null;
  responseNote: string | null;
  serviceNames: string[];
  status: string;
  updatedAt: string;
}

interface QuotesResponse {
  quotes?: QuoteRequest[];
}

type QuoteTab = 'pending' | 'received';

type SubmitMessage = {
  text: string;
  type: 'error' | 'success';
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));

const hasReceivedQuotation = (quote: QuoteRequest) =>
  quote.quoteAmount !== null &&
  quote.quoteAmount !== undefined &&
  ['accepted', 'closed', 'contacted', 'negotiating', 'quoted', 'sent'].includes(quote.status);

const canRespondToQuote = (quote: QuoteRequest) =>
  hasReceivedQuotation(quote) &&
  !['accepted', 'closed', 'negotiating'].includes(quote.status);

const getPrimaryProductName = (quote: QuoteRequest) => {
  const [firstProduct, ...otherProducts] = quote.products;

  if (!firstProduct) {
    return 'Quotation request';
  }

  return otherProducts.length
    ? `${firstProduct.productName} +${otherProducts.length}`
    : firstProduct.productName;
};

const MyQuotes: React.FC = () => {
  const history = useHistory();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<QuoteTab>('pending');
  const [respondingQuoteId, setRespondingQuoteId] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);
  const [respondToQuote] = useRespondToMyQuotationRequestMutation();
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
  const quotes = ((data as QuotesResponse | undefined)?.quotes ?? []) as QuoteRequest[];
  const pendingQuotes = quotes.filter((quote) => !hasReceivedQuotation(quote));
  const receivedQuotes = quotes.filter(hasReceivedQuotation);
  const visibleQuotes = activeTab === 'pending' ? pendingQuotes : receivedQuotes;

  const handleAcceptQuote = async (quote: QuoteRequest) => {
    setSubmitMessage(null);
    setRespondingQuoteId(quote.id);

    try {
      await respondToQuote({
        action: 'accept',
        id: quote.id
      }).unwrap();

      setSubmitMessage({
        text: `${formatQuotationReference(quote.id)} accepted successfully.`,
        type: 'success'
      });
      setActiveTab('received');
      await refetch();
    } catch {
      setSubmitMessage({
        text: 'Unable to accept quotation right now.',
        type: 'error'
      });
    } finally {
      setRespondingQuoteId(null);
    }
  };

  const renderGuestState = () => (
    <section className="ctl-quotes-empty">
      <div className="ctl-quotes-empty__icon">
        <IonIcon icon={documentTextOutline} />
      </div>
      <h2>Login to view your quotes</h2>
      <p>Quotation history is saved with your account after you sign in.</p>
      <div className="ctl-quotes-auth-actions">
        <button
          className="ctl-quotes-action ctl-quotes-action--primary"
          onClick={() => history.push('/login')}
          type="button"
        >
          <IonIcon icon={logInOutline} />
          Login
        </button>
        <button
          className="ctl-quotes-action"
          onClick={() => history.push('/register')}
          type="button"
        >
          <IonIcon icon={personAddOutline} />
          Register
        </button>
      </div>
    </section>
  );

  const renderEmptyState = () => (
    <section className="ctl-quotes-empty">
      <div className="ctl-quotes-empty__icon">
        <IonIcon icon={documentTextOutline} />
      </div>
      <h2>No quotes yet</h2>
      <p>Request a quotation and it will appear here once submitted.</p>
      <button
        className="ctl-quotes-action ctl-quotes-action--primary"
        onClick={() => history.push('/quote')}
        type="button"
      >
        <IonIcon icon={addCircleOutline} />
        Request Quote
      </button>
    </section>
  );

  const renderErrorState = () => (
    <section className="ctl-quotes-empty">
      <div className="ctl-quotes-empty__icon ctl-quotes-empty__icon--error">
        <IonIcon icon={alertCircleOutline} />
      </div>
      <h2>Unable to load quotes</h2>
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

  const renderContent = () => {
    if (!user) {
      return renderGuestState();
    }

    if (isFetching) {
      return (
        <section className="ctl-quotes-list" aria-label="Loading quotation requests">
          {[0, 1].map((item) => (
            <article className="ctl-quote-card ctl-quote-card--loading" key={item}>
              <span />
              <span />
              <span />
            </article>
          ))}
        </section>
      );
    }

    if (error) {
      return renderErrorState();
    }

    if (!quotes.length) {
      return renderEmptyState();
    }

    return (
      <>
        <section className="ctl-quotes-tabs" aria-label="Quote filters">
          <button
            className={`ctl-quotes-tab${
              activeTab === 'pending' ? ' ctl-quotes-tab--active' : ''
            }`}
            onClick={() => setActiveTab('pending')}
            type="button"
          >
            <span className="ctl-quotes-tab__dot ctl-quotes-tab__dot--pending" />
            Pending
            <em>{pendingQuotes.length}</em>
          </button>
          <button
            className={`ctl-quotes-tab${
              activeTab === 'received' ? ' ctl-quotes-tab--active' : ''
            }`}
            onClick={() => setActiveTab('received')}
            type="button"
          >
            <span className="ctl-quotes-tab__dot ctl-quotes-tab__dot--received" />
            Received
            <em>{receivedQuotes.length}</em>
          </button>
        </section>

        {submitMessage ? (
          <p className={`ctl-quotes-message ctl-quotes-message--${submitMessage.type}`}>
            {submitMessage.text}
          </p>
        ) : null}

        {!visibleQuotes.length ? (
          <section className="ctl-quotes-empty ctl-quotes-empty--inline">
            <div className="ctl-quotes-empty__icon">
              <IonIcon icon={documentTextOutline} />
            </div>
            <h2>
              {activeTab === 'pending' ? 'No pending requests' : 'No received quotations'}
            </h2>
            <p>
              {activeTab === 'pending'
                ? 'Your pending requests will appear here while the team prepares a quote.'
                : 'Admin-sent quotations will appear here when ready for review.'}
            </p>
          </section>
        ) : (
          <section className="ctl-quotes-list" aria-label="Quotation requests">
            {visibleQuotes.map((quote) => (
          <article className="ctl-quote-card" key={quote.id}>
            <div className="ctl-quote-card__top">
              <div>
                <span className="ctl-quote-card__eyebrow">Reference ID</span>
                <h2>{formatQuotationReference(quote.id)}</h2>
              </div>
              <span className={`ctl-quote-status ctl-quote-status--${quote.status}`}>
                {formatQuotationStatus(quote.status)}
              </span>
            </div>

            <div className="ctl-quote-card__meta">
              <IonIcon icon={timeOutline} />
              <span>{formatDate(quote.createdAt)}</span>
            </div>

            <div className="ctl-quote-service-row">
              {quote.serviceNames.map((serviceName) => (
                <span key={serviceName}>{serviceName}</span>
              ))}
            </div>

            <div className="ctl-quote-product-summary">
              <span>Product</span>
              <strong>{getPrimaryProductName(quote)}</strong>
            </div>

            {hasReceivedQuotation(quote) ? (
              <section className="ctl-quote-received">
                <div className="ctl-quote-received__top">
                  <span>
                    <IonIcon icon={receiptOutline} />
                    Quotation Received
                  </span>
                  <strong>{formatIndianCurrency(quote.quoteAmount)}</strong>
                </div>

                {quote.quoteDetails?.items.length ? (
                  <div className="ctl-quote-received__items">
                    {quote.quoteDetails.items.map((item, index) => (
                      <div
                        className="ctl-quote-received__item"
                        key={`${item.id || item.productName}-${index}`}
                      >
                        <div>
                          <strong>{item.productName || 'Quote item'}</strong>
                          <span>{item.quantity || 'Quantity not specified'}</span>
                        </div>
                        <em>{formatIndianCurrency(item.price)}</em>
                      </div>
                    ))}
                  </div>
                ) : null}

                {quote.quoteDetails?.deliveryCharges !== null &&
                quote.quoteDetails?.deliveryCharges !== undefined ? (
                  <div className="ctl-quote-received__charge">
                    <span>Delivery</span>
                    <strong>{formatIndianCurrency(quote.quoteDetails.deliveryCharges)}</strong>
                  </div>
                ) : null}

                {quote.quoteDetails?.gstPercent !== null &&
                quote.quoteDetails?.gstPercent !== undefined ? (
                  <div className="ctl-quote-received__charge">
                    <span>GST</span>
                    <strong>{quote.quoteDetails.gstPercent}%</strong>
                  </div>
                ) : null}

                {quote.responseNote || quote.quoteDetails?.responseNote ? (
                  <p>{quote.responseNote ?? quote.quoteDetails?.responseNote}</p>
                ) : null}

                {quote.status === 'negotiating' ? (
                  <div className="ctl-quote-response-state">
                    <IonIcon icon={chatbubbleEllipsesOutline} />
                    <span>
                      Negotiation sent
                      {quote.customerOfferAmount
                        ? ` at ${formatIndianCurrency(quote.customerOfferAmount)}`
                        : ''}
                    </span>
                  </div>
                ) : null}

                {quote.status === 'accepted' || quote.status === 'closed' ? (
                  <div className="ctl-quote-response-state ctl-quote-response-state--accepted">
                    <IonIcon icon={checkmarkCircleOutline} />
                    <span>Quotation accepted</span>
                  </div>
                ) : null}
              </section>
            ) : null}

            <div className="ctl-quote-products">
              {quote.products.map((product) => (
                <div className="ctl-quote-product-row" key={product.id}>
                  <IonIcon icon={cubeOutline} />
                  <div>
                    <strong>{product.productName}</strong>
                    <span>{product.serviceName}</span>
                  </div>
                  <em>{product.quantity}</em>
                </div>
              ))}
            </div>

            {quote.notes ? <p className="ctl-quote-card__notes">{quote.notes}</p> : null}

            {canRespondToQuote(quote) ? (
              <div className="ctl-quote-review-actions">
                <button
                  className="ctl-quote-review-action ctl-quote-review-action--accept"
                  disabled={respondingQuoteId === quote.id}
                  onClick={() => void handleAcceptQuote(quote)}
                  type="button"
                >
                  <IonIcon icon={checkmarkOutline} />
                  {respondingQuoteId === quote.id ? 'ACCEPTING...' : 'ACCEPT'}
                </button>
                <button
                  className="ctl-quote-review-action"
                  disabled={Boolean(respondingQuoteId)}
                  onClick={() => history.push(`/quotes/${quote.id}/negotiate`)}
                  type="button"
                >
                  <IonIcon icon={chatbubbleEllipsesOutline} />
                  NEGOTIATE
                </button>
              </div>
            ) : null}
          </article>
            ))}
          </section>
        )}
      </>
    );
  };

  return (
    <IonPage>
      <AppHeader
        brandTrailing="user"
        onProfile={() => history.push('/profile')}
        title="Chandigarh Trade Link"
        variant="brand"
      />
      <IonContent className="ctl-account-content" fullscreen>
        <main className="ctl-account ctl-quotes">
          <section className="ctl-account-title ctl-quotes-title">
            <h1>My Quotes</h1>
            <p>Track your submitted quotation requests and product quantities.</p>
          </section>

          {renderContent()}
        </main>
      </IonContent>
    </IonPage>
  );
};

export default MyQuotes;
