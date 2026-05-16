import { IonIcon } from '@ionic/react';
import {
  businessOutline,
  cardOutline,
  checkmarkOutline,
  copyOutline,
  logOutOutline,
  personCircleOutline
} from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router';
import AdminPageShell from '../../components/admin/AdminPageShell';
import {
  getUserEmailLabel,
  getUserInitials
} from '../../lib/userProfile';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

interface AdminProfileDetail {
  label: string;
  value: string;
}

const companyDetails: AdminProfileDetail[] = [
  { label: 'Company Name', value: 'Chandigarh Trade Link' },
  { label: 'GST Number', value: '03XXXXXXXXXXX1Z5' }
];

const accountDetails: AdminProfileDetail[] = [
  { label: 'Account Name', value: 'Chandigarh Trade Link' },
  { label: 'Account Number', value: 'XXXXXXXXXXXX' },
  { label: 'IFSC Code', value: 'XXXXXXXX' },
  { label: 'Branch Name', value: 'Zirakpur Branch' }
];

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

const AdminProfile: React.FC = () => {
  const history = useHistory();
  const clearSession = useAuthStore((state) => state.clearSession);
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const companyName = 'Chandigarh Trade Link';
  const email = getUserEmailLabel(user) || 'admin@ctl.com';
  const [copiedDetail, setCopiedDetail] = useState<string | null>(null);
  const copyResetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyResetTimer.current) {
        window.clearTimeout(copyResetTimer.current);
      }
    },
    []
  );

  const handleCopyDetail = async (detail: AdminProfileDetail) => {
    await copyText(detail.value);
    setCopiedDetail(detail.label);

    if (copyResetTimer.current) {
      window.clearTimeout(copyResetTimer.current);
    }

    copyResetTimer.current = window.setTimeout(() => {
      setCopiedDetail(null);
    }, 1400);
  };

  const renderDetailRows = (details: AdminProfileDetail[]) =>
    details.map((detail) => {
      const isCopied = copiedDetail === detail.label;

      return (
        <button
          aria-label={`Copy ${detail.label}`}
          className={`ctl-admin-profile-detail-row${
            isCopied ? ' ctl-admin-profile-detail-row--copied' : ''
          }`}
          key={detail.label}
          onClick={() => {
            void handleCopyDetail(detail);
          }}
          type="button"
        >
          <span>{detail.label}</span>
          <strong>{detail.value}</strong>
          <em aria-live="polite">
            <IonIcon icon={isCopied ? checkmarkOutline : copyOutline} />
            {isCopied ? 'Copied' : ''}
          </em>
        </button>
      );
    });

  const handleLogout = async () => {
    if (session) {
      await authService.logout();
    }

    clearSession();
    history.replace('/login');
  };

  return (
    <AdminPageShell activeTab="Profile" title="Profile">
      <section className="ctl-admin-profile">
        <article className="ctl-admin-profile-card">
          <div className="ctl-admin-profile-avatar" aria-label={`${companyName} admin avatar`}>
            {getUserInitials(user, 'A')}
          </div>

          <div className="ctl-admin-profile-name">
            <h2>
              <IonIcon icon={personCircleOutline}/>
              Admin Profile
            </h2>
            <strong>{companyName}</strong>
            <p>{email}</p>
          </div>
        </article>

        <article className="ctl-admin-profile-section">
          <h3>
            <IonIcon icon={businessOutline} />
            Company Details
          </h3>
          <div className="ctl-admin-profile-detail-list">
            {renderDetailRows(companyDetails)}
          </div>
        </article>

        <article className="ctl-admin-profile-section">
          <h3>
            <IonIcon icon={cardOutline} />
            Account Details
          </h3>
          <div className="ctl-admin-profile-detail-list">
            {renderDetailRows(accountDetails)}
          </div>
        </article>

        <article className="ctl-admin-profile-actions">
          <button className="ctl-admin-danger-action" onClick={handleLogout} type="button">
            <IonIcon icon={logOutOutline} />
            Logout
          </button>
        </article>
      </section>
    </AdminPageShell>
  );
};

export default AdminProfile;
