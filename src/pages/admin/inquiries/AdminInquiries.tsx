import { IonIcon } from '@ionic/react';
import { refreshOutline, searchOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import AdminPageShell from '../../../components/admin/AdminPageShell';
import AdminStatusBadge from '../../../components/admin/AdminStatusBadge';
import {
  formatQuotationReference,
  getQuotationStatusGroup,
  type QuotationStatusGroup
} from '../../../lib/quotation';
import {
  type AdminQuotationFilter,
  type AdminQuotationRequest,
  useGetAdminQuotationRequestsQuery
} from '../../../services/api/edgeFunctionsApi';

const statusFilters: AdminQuotationFilter[] = [
  'accepted',
  'all',
  'negotiating',
  'pending',
  'sent'
];

const getFilterFromSearch = (search: string): AdminQuotationFilter => {
  const status = new URLSearchParams(search).get('status');

  return statusFilters.includes(status as AdminQuotationFilter)
    ? (status as AdminQuotationFilter)
    : 'pending';
};

const getInquiryService = (quote: AdminQuotationRequest) => {
  const [firstService, ...otherServices] = quote.serviceNames;

  if (!firstService) {
    return 'Inquiry';
  }

  return otherServices.length ? `${firstService} +${otherServices.length}` : firstService;
};

const getInquiryQuantity = (quote: AdminQuotationRequest) => {
  const quantities = quote.products
    .map((product) => product.quantity.trim())
    .filter(Boolean);

  if (!quantities.length) {
    return 'Not specified';
  }

  return quantities.length > 1 ? `${quantities[0]} +${quantities.length - 1} items` : quantities[0];
};

const emptyCopyByFilter: Record<AdminQuotationFilter, string> = {
  accepted: 'No accepted inquiries found',
  all: 'No inquiries found',
  negotiating: 'No negotiating inquiries found',
  pending: 'No pending inquiries found',
  sent: 'No sent inquiries found'
};

const AdminInquiries: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState<AdminQuotationFilter>(() =>
    getFilterFromSearch(location.search)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const { data, error, isFetching, refetch } = useGetAdminQuotationRequestsQuery({
    limit: 100
  });

  useEffect(() => {
    setActiveFilter(getFilterFromSearch(location.search));
  }, [location.search]);

  const openQuote = (quote: AdminQuotationRequest) => {
    const statusGroup = getQuotationStatusGroup(quote.status);

    if (statusGroup === 'sent' || statusGroup === 'accepted') {
      history.push(`/admin/quote-preview/${quote.id}`);
      return;
    }

    history.push(`/admin/quote/${quote.id}`);
  };

  const filteredQuotes = useMemo(() => {
    const quotes = data?.quotes ?? [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return quotes.filter((quote) => {
      const matchesStatus =
        activeFilter === 'all' ||
        getQuotationStatusGroup(quote.status) === (activeFilter as QuotationStatusGroup);

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        formatQuotationReference(quote.id),
        quote.customer.name,
        quote.customer.email,
        quote.customer.phone,
        quote.id,
        quote.notes ?? '',
        ...quote.serviceNames,
        ...quote.products.map((product) => product.productName)
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [activeFilter, data?.quotes, searchTerm]);

  const renderList = () => {
    if (isFetching) {
      return (
        <div className="ctl-admin-inquiry-list">
          {[0, 1, 2].map((item) => (
            <article className="ctl-admin-skeleton" key={item} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <section className="ctl-admin-empty">
          <h2>Unable to load inquiries</h2>
          <p>Admin inquiry data could not be loaded right now.</p>
          <button className="ctl-admin-primary-action" onClick={() => refetch()} type="button">
            <IonIcon icon={refreshOutline} />
            Retry
          </button>
        </section>
      );
    }

    if (!filteredQuotes.length) {
      return (
        <section className="ctl-admin-empty">
          <h2>{emptyCopyByFilter[activeFilter]}</h2>
          <p>Try another search term.</p>
        </section>
      );
    }

    return (
      <div className="ctl-admin-inquiry-list">
        {filteredQuotes.map((quote) => (
          <article
            className="ctl-admin-inquiry-card ctl-admin-inquiry-card--clickable"
            key={quote.id}
            onClick={() => openQuote(quote)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openQuote(quote);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="ctl-admin-inquiry-card__body">
              <div className="ctl-admin-inquiry-card__top">
                <strong className="ctl-admin-inquiry-reference">
                  {formatQuotationReference(quote.id)}
                </strong>
                {activeFilter === 'sent' ? <AdminStatusBadge status={quote.status} /> : null}
              </div>
              <h2>{quote.customer.name}</h2>
              <p>{getInquiryService(quote)}</p>
              <span>Qty: {getInquiryQuantity(quote)}</span>
            </div>
            <span className="ctl-admin-card-action ctl-admin-inquiry-card__action">
              OPEN INQUIRY
            </span>
          </article>
        ))}
      </div>
    );
  };

  return (
    <AdminPageShell
      activeTab="Inquiries"
      brandLeading={location.search ? 'back' : 'menu'}
      hideTitle
      title={
        location.search ? 
        activeFilter == "sent" ? "Responded" : "Pending"
        : "Inquiries"
      }
    >
      <section className="ctl-admin-content-stack ctl-admin-inquiries">
        <div className="ctl-admin-inquiries-search">
          <h1>Search</h1>
          <label className="ctl-admin-search">
            <IonIcon icon={searchOutline} />
            <input
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search inquiry..."
              type="search"
              value={searchTerm}
            />
          </label>
        </div>

        {renderList()}
      </section>
    </AdminPageShell>
  );
};

export default AdminInquiries;
