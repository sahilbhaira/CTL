import { IonIcon } from '@ionic/react';
import {
  checkmarkCircleOutline,
  chatbubbleEllipsesOutline,
  peopleOutline,
  refreshOutline,
  searchOutline,
  sendOutline,
  timeOutline
} from 'ionicons/icons';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router';
import AdminLeadCard from '../../components/admin/AdminLeadCard';
import AdminPageShell from '../../components/admin/AdminPageShell';
import AdminStatCard from '../../components/admin/AdminStatCard';
import {
  getQuotationStatusGroup,
  type QuotationStatusGroup
} from '../../lib/quotation';
import {
  type AdminQuotationFilter,
  type AdminQuotationStats,
  useGetAdminQuotationRequestsQuery
} from '../../services/api/edgeFunctionsApi';

const filters: Array<{
  icon: string;
  label: string;
  status: AdminQuotationFilter;
  tone: 'accepted' | 'negotiating' | 'pending' | 'primary' | 'sent';
  wide?: boolean;
}> = [
  { icon: peopleOutline, label: 'All Leads', status: 'all', tone: 'primary', wide: true },
  { icon: timeOutline, label: 'Pending', status: 'pending', tone: 'pending' },
  { icon: sendOutline, label: 'Sent', status: 'sent', tone: 'sent' },
  {
    icon: chatbubbleEllipsesOutline,
    label: 'Negotiating',
    status: 'negotiating',
    tone: 'negotiating'
  },
  { icon: checkmarkCircleOutline, label: 'Accepted', status: 'accepted', tone: 'accepted' }
];

const getFilterCount = (
  filter: AdminQuotationFilter,
  stats: AdminQuotationStats | undefined
) => {
  if (!stats) {
    return 0;
  }

  if (filter === 'all') {
    return stats.total;
  }

  return stats[filter as Exclude<AdminQuotationFilter, 'all'>] ?? 0;
};

const AdminLeads: React.FC = () => {
  const history = useHistory();
  const [activeFilter, setActiveFilter] = useState<AdminQuotationFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { data, error, isFetching, refetch } = useGetAdminQuotationRequestsQuery({
    limit: 100
  });

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
        <div className="ctl-admin-list">
          {[0, 1, 2].map((item) => (
            <article className="ctl-admin-skeleton" key={item} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <section className="ctl-admin-empty">
          <h2>Unable to load leads</h2>
          <p>Admin lead data could not be loaded right now.</p>
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
          <h2>No leads found</h2>
          <p>Try another status filter or search term.</p>
        </section>
      );
    }

    return (
      <div className="ctl-admin-list">
        {filteredQuotes.map((quote) => (
          <AdminLeadCard
            key={quote.id}
            onAction={(selectedQuote) =>
              history.push(
                getQuotationStatusGroup(selectedQuote.status) === 'negotiating'
                  ? '/admin/negotiations'
                  : `/admin/quote-preview/${selectedQuote.id}`
              )
            }
            quote={quote}
          />
        ))}
      </div>
    );
  };

  return (
    <AdminPageShell
      activeTab="Leads"
      subtitle="Manage and track all quotation requests."
      title="Leads"
    >
      <section className="ctl-admin-content-stack">
        <label className="ctl-admin-search">
          <IonIcon icon={searchOutline} />
          <input
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search inquiries..."
            type="search"
            value={searchTerm}
          />
        </label>

        <div className="ctl-admin-stats-grid">
          {filters.map((filter) => (
            <AdminStatCard
              active={activeFilter === filter.status}
              icon={filter.icon}
              key={filter.status}
              label={filter.label}
              onClick={() => setActiveFilter(filter.status)}
              tone={filter.tone}
              value={getFilterCount(filter.status, data?.stats)}
              wide={filter.wide}
            />
          ))}
        </div>

        {renderList()}
      </section>
    </AdminPageShell>
  );
};

export default AdminLeads;
