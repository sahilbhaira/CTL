import { IonIcon } from '@ionic/react';
import { checkmarkDoneCircleOutline, refreshOutline } from 'ionicons/icons';
import { useMemo } from 'react';
import { useHistory } from 'react-router';
import AdminLeadCard from '../../components/admin/AdminLeadCard';
import AdminPageShell from '../../components/admin/AdminPageShell';
import { getQuotationStatusGroup } from '../../lib/quotation';
import { useGetAdminQuotationRequestsQuery } from '../../services/api/edgeFunctionsApi';

const AdminAcceptedQuotes: React.FC = () => {
  const history = useHistory();
  const { data, error, isFetching, refetch } = useGetAdminQuotationRequestsQuery({
    limit: 100
  });
  const acceptedQuotes = useMemo(
    () =>
      (data?.quotes ?? []).filter(
        (quote) => getQuotationStatusGroup(quote.status) === 'accepted'
      ),
    [data?.quotes]
  );

  const renderContent = () => {
    if (isFetching) {
      return (
        <section className="ctl-admin-list">
          {[0, 1].map((item) => (
            <article className="ctl-admin-skeleton" key={item} />
          ))}
        </section>
      );
    }

    if (error) {
      return (
        <section className="ctl-admin-empty">
          <h2>Unable to load accepted quotes</h2>
          <p>Please check the admin Edge Function and try again.</p>
          <button className="ctl-admin-primary-action" onClick={() => refetch()} type="button">
            <IonIcon icon={refreshOutline} />
            Retry
          </button>
        </section>
      );
    }

    if (!acceptedQuotes.length) {
      return (
        <section className="ctl-admin-empty">
          <div className="ctl-admin-empty__icon ctl-admin-empty__icon--accepted">
            <IonIcon icon={checkmarkDoneCircleOutline} />
          </div>
          <h2>No accepted quotes yet</h2>
          <p>Finalized quotes will be listed here after customers accept them.</p>
        </section>
      );
    }

    return (
      <section className="ctl-admin-list">
        {acceptedQuotes.map((quote) => (
          <AdminLeadCard
            actionLabel="VIEW DETAILS"
            key={quote.id}
            onAction={() => history.push(`/admin/quote/${quote.id}`)}
            quote={quote}
            showAmount
          />
        ))}
      </section>
    );
  };

  return (
    <AdminPageShell
      activeTab="Inquiries"
      brandLeading="back"
      subtitle="Review quotes that have been finalized and accepted."
      title="Accepted Quotes"
    >
      {renderContent()}
    </AdminPageShell>
  );
};

export default AdminAcceptedQuotes;
