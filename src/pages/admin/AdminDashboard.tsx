import { IonIcon } from '@ionic/react';
import {
  checkmarkCircleOutline,
  chatbubbleEllipsesOutline,
  listOutline,
  peopleOutline,
  refreshOutline,
  sendOutline,
  timeOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import AdminLeadCard from '../../components/admin/AdminLeadCard';
import AdminPageShell from '../../components/admin/AdminPageShell';
import AdminStatCard from '../../components/admin/AdminStatCard';
import { getUserDisplayName } from '../../lib/userProfile';
import { useGetAdminQuotationRequestsQuery } from '../../services/api/edgeFunctionsApi';
import { useAuthStore } from '../../store/authStore';

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
            />
            <AdminStatCard
              icon={timeOutline}
              label="Pending"
              tone="pending"
              value={stats?.pending ?? 0}
            />
            <AdminStatCard
              icon={checkmarkCircleOutline}
              label="Responded"
              tone="sent"
              value={stats?.responded ?? 0}
            />
            <AdminStatCard
              icon={chatbubbleEllipsesOutline}
              label="Negotiating"
              tone="negotiating"
              value={stats?.negotiating ?? 0}
            />
          </div>
        </section>

        <section className="ctl-admin-section">
          <h3>Quick Actions</h3>
          <div className="ctl-admin-actions">
            <button
              className="ctl-admin-secondary-action"
              onClick={() => history.push('/admin/leads')}
              type="button"
            >
              <IonIcon icon={listOutline} />
              VIEW LEADS
            </button>
            <button
              className="ctl-admin-primary-action"
              onClick={() => history.push('/admin/quote-preview')}
              type="button"
            >
              <IonIcon icon={sendOutline} />
              CREATE QUOTE
            </button>
          </div>
        </section>

        <section className="ctl-admin-section">
          <div className="ctl-admin-section-heading">
            <h3>Recent Inquiries</h3>
            <button onClick={() => history.push('/admin/leads')} type="button">
              View All
            </button>
          </div>

          {recentQuotes.length ? (
            <div className="ctl-admin-list">
              {recentQuotes.map((quote) => (
                <AdminLeadCard
                  actionLabel="VIEW INQUIRY"
                  key={quote.id}
                  onAction={() => history.push(`/admin/quote-preview/${quote.id}`)}
                  quote={quote}
                />
              ))}
            </div>
          ) : (
            <section className="ctl-admin-empty ctl-admin-empty--compact">
              <h2>No inquiries yet</h2>
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
      subtitle={`Welcome back, ${getUserDisplayName(user)}. Here is your overview for today.`}
      title="Dashboard"
    >
      {renderContent()}
    </AdminPageShell>
  );
};

export default AdminDashboard;
