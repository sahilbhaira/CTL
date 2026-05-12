import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  addCircleOutline,
  alertCircleOutline,
  cubeOutline,
  documentTextOutline,
  logInOutline,
  personAddOutline,
  refreshOutline,
  timeOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import AppHeader from '../../components/header/AppHeader';
import { formatQuotationReference, formatQuotationStatus } from '../../lib/quotation';
import { useFetchEdgeFunctionQuery } from '../../services/api/edgeFunctionsApi';
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

interface QuoteRequest {
  createdAt: string;
  id: string;
  notes: string | null;
  products: QuoteProduct[];
  serviceNames: string[];
  status: string;
}

interface QuotesResponse {
  quotes?: QuoteRequest[];
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));

const MyQuotes: React.FC = () => {
  const history = useHistory();
  const user = useAuthStore((state) => state.user);
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
      <section className="ctl-quotes-list" aria-label="Quotation requests">
        {quotes.map((quote) => (
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
          </article>
        ))}
      </section>
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
