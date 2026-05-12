import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { cameraOutline, logOutOutline } from 'ionicons/icons';
import { useHistory } from 'react-router';
import AppHeader from '../../components/header/AppHeader';
import {
  getUserDisplayName,
  getUserEmailLabel,
  getUserInitials
} from '../../lib/userProfile';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import './account.css';

const Profile: React.FC = () => {
  const history = useHistory();
  const clearSession = useAuthStore((state) => state.clearSession);
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const fullName = getUserDisplayName(user);
  const email = getUserEmailLabel(user);

  const handleLogout = async () => {
    if (session) {
      await authService.logout();
    }

    clearSession();
    history.replace('/login');
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
        <main className="ctl-account">
          <section className="ctl-account-title">
            <h1>My Profile</h1>
          </section>

          <section className="ctl-profile-shell">
            <article className="ctl-profile-card">
              <div className="ctl-profile-avatar-wrap">
                <div aria-label={`${fullName} profile avatar`} className="ctl-profile-avatar">
                  {getUserInitials(user)}
                </div>
                {user ? (
                  <button aria-label="Change profile photo" className="ctl-profile-camera" type="button">
                    <IonIcon icon={cameraOutline} />
                  </button>
                ) : null}
              </div>

              <div className="ctl-profile-name">
                <h2>{fullName}</h2>
                <p>{email}</p>
              </div>

              <div className="ctl-profile-divider" />

              <button className="ctl-logout-button" onClick={handleLogout} type="button">
                <IonIcon icon={logOutOutline} />
                Logout
              </button>
            </article>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
