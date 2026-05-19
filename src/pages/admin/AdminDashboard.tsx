import { IonIcon } from '@ionic/react';
import {
  checkmarkCircleOutline,
  chatbubbleEllipsesOutline,
  peopleOutline,
  refreshOutline,
  timeOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import AdminPageShell from '../../components/admin/AdminPageShell';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { getQuotationStatusGroup } from '../../lib/quotation';
import { getUserDisplayName } from '../../lib/userProfile';
import {
  type AdminQuotationRequest,
  useGetAdminQuotationRequestsQuery
} from '../../services/api/edgeFunctionsApi';
import { useAuthStore } from '../../store/authStore';

const getRelativeTime = (date: string) => {
  const diffInMinutes = Math.max(
    Math.round((Date.now() - new Date(date).getTime()) / 60000),
    0
  );

  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} mins ago`;
  }

  const diffInHours = Math.round(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hr' : 'hrs'} ago`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
};

const getRecentInquiryPath = (quote: AdminQuotationRequest) => {
  const statusGroup = getQuotationStatusGroup(quote.status);

  if (statusGroup === 'pending') {
    return `/admin/quote/${quote.id}`;
  }

  if (statusGroup === 'negotiating') {
    return `/admin/negotiations/${quote.id}`;
  }

  return `/admin/quote-preview/${quote.id}`;
};

const AdminDashboard: React.FC = () => {
  const history = useHistory();
  const user = useAuthStore((state) => state.user);
  const { data, error, isFetching, refetch } = useGetAdminQuotationRequestsQuery({
    limit: 50
  });
  const quotes = data?.quotes ?? [];
  const stats = data?.stats;
  const recentQuotes = quotes.slice(0, 2);

  const renderContent = () => {
    if (isFetching) {
      return (
        <section className="ctl-admin-list" aria-label="Loading admin dashboard">
          {[0, 1, 2].map((item) => (
            <article className="ctl-admin-skeleton" key={item} />
          ))}
        </section>
      );
    }

    if (error) {
      return (
        <section className="ctl-admin-empty">
          <h2>Unable to load dashboard</h2>
          <p>Admin data is served by Supabase Edge Functions. Please try again.</p>
          <button className="ctl-admin-primary-action" onClick={() => refetch()} type="button">
            <IonIcon icon={refreshOutline} />
            Retry
          </button>
        </section>
      );
    }

    return (
      <>
        <section className="ctl-admin-section">
          <h3>Stats Overview</h3>
          <div className="ctl-admin-stats-grid">
            <AdminStatCard
              icon={peopleOutline}
              label="Total Leads"
              value={stats?.total ?? 0}
              wide
            />
            <AdminStatCard
              icon={timeOutline}
              label="Pending"
              onClick={() => history.push('/admin/inquiries?status=pending')}
              tone="pending"
              value={stats?.pending ?? 0}
            />
            <AdminStatCard
              icon={checkmarkCircleOutline}
              label="Responded"
              onClick={() => history.push('/admin/inquiries?status=sent')}
              tone="sent"
              value={stats?.responded ?? 0}
            />
            <AdminStatCard
              icon={chatbubbleEllipsesOutline}
              label="Negotiating"
              onClick={() => history.push('/admin/negotiations')}
              tone="negotiating"
              value={stats?.negotiating ?? 0}
            />
            <AdminStatCard
              icon={checkmarkCircleOutline}
              label="Accepted"
              onClick={() => history.push('/admin/accepted')}
              tone="accepted"
              value={stats?.accepted ?? 0}
            />
          </div>
        </section>

        <section className="ctl-admin-section">
          <div className="ctl-admin-section-heading">
            <h3>Recent Activity</h3>
          </div>

          {recentQuotes.length ? (
            <div className="ctl-admin-activity-list">
              {recentQuotes.map((quote) => {
                const inquiryPath = getRecentInquiryPath(quote);

                return (
                  <article className="ctl-admin-activity-card" key={quote.id}>
                    <div
                      className="ctl-admin-activity-card__body"
                      onClick={() => history.push(inquiryPath)}
                    >
                      <div className="ctl-admin-activity-card__top">
                        <h2>{quote.customer.name}</h2>
                        <AdminStatusBadge status={quote.status} />
                      </div>
                      <p>
                        {quote.serviceNames[0] ?? 'Inquiry'}
                        {quote.products[0]?.productName ? ` • ${quote.products[0].productName}` : ''}
                      </p>
                      <span>{getRelativeTime(quote.createdAt)}</span>
                    </div>
                    <button
                      className="ctl-admin-card-action"
                      onClick={() => history.push(inquiryPath)}
                      type="button"
                    >
                      OPEN INQUIRY
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <section className="ctl-admin-empty ctl-admin-empty--compact">
              <h2>No recent activity</h2>
              <p>Customer quotation requests will appear here once submitted.</p>
            </section>
          )}
        </section>
      </>
    );
  };

  return (
    <AdminPageShell
      activeTab="Dashboard"
      subtitle={`Welcome back, ${getUserDisplayName(user)}`}
      title="Dashboard"
    >
      {renderContent()}
    </AdminPageShell>
  );
};

export default AdminDashboard;
