import { IonContent, IonPage } from '@ionic/react';
import type { ReactNode } from 'react';
import { useHistory } from 'react-router';
import AppHeader from '../header/AppHeader';
import AdminBottomNav, { type AdminTab } from './AdminBottomNav';
import { goToPreviousPage } from '../../lib/navigation';
import '../../pages/admin/admin.css';

interface AdminPageShellProps {
  activeTab: AdminTab;
  brandLeading?: 'back' | 'menu';
  children: ReactNode;
  hideTitle?: boolean;
  subtitle?: string;
  title?: string;
}

const AdminPageShell: React.FC<AdminPageShellProps> = ({
  activeTab,
  brandLeading = 'menu',
  children,
  hideTitle,
  title
}) => {
  const history = useHistory();

  return (
    <IonPage>
      <AppHeader
        brandLeading={brandLeading}
        brandTrailing="user"
        onBack={() => goToPreviousPage(history)}
        onProfile={() => history.push('/admin/profile')}
        title={brandLeading === 'back' && title ? title : 'Chandigarh Trade Link Admin'}
        variant="brand"
      />
      <IonContent className="ctl-admin-content" fullscreen>
        <main className="ctl-admin-page">
          {!hideTitle && title ? (
            <section className="ctl-admin-title">
              {/* <h1>{title}</h1>
              {subtitle ? <p>{subtitle}</p> : null} */}
            </section>
          ) : null}

          {children}
        </main>
      </IonContent>
      <AdminBottomNav activeTab={activeTab} />
    </IonPage>
  );
};

export default AdminPageShell;
