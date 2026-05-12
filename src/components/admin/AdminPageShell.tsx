import { IonContent, IonPage } from '@ionic/react';
import type { ReactNode } from 'react';
import { useHistory } from 'react-router';
import AppHeader from '../header/AppHeader';
import AdminBottomNav, { type AdminTab } from './AdminBottomNav';
import '../../pages/admin/admin.css';

interface AdminPageShellProps {
  activeTab: AdminTab;
  children: ReactNode;
  subtitle: string;
  title: string;
}

const AdminPageShell: React.FC<AdminPageShellProps> = ({
  activeTab,
  children,
  subtitle,
  title
}) => {
  const history = useHistory();

  return (
    <IonPage>
      <AppHeader
        brandTrailing="user"
        onProfile={() => history.push('/admin/dashboard')}
        title="Chandigarh Trade Link Admin"
        variant="brand"
      />
      <IonContent className="ctl-admin-content" fullscreen>
        <main className="ctl-admin-page">
          <section className="ctl-admin-title">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </section>

          {children}
        </main>
      </IonContent>
      <AdminBottomNav activeTab={activeTab} />
    </IonPage>
  );
};

export default AdminPageShell;
