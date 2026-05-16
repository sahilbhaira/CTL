import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  cameraOutline,
  logInOutline,
  logOutOutline,
  personAddOutline,
  personCircleOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import AppHeader from '../../components/header/AppHeader';
import {
  getUserDisplayName,
  getUserEmailLabel,
  getUserInitials
} from '../../lib/userProfile';
import { goToPreviousPage } from '../../lib/navigation';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import './account.css';

const Profile: React.FC = () => {
  const history = useHistory();
  const clearSession = useAuthStore((state) => state.clearSession);
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const isGuest = !user;
  const fullName = getUserDisplayName(user);
  const email = getUserEmailLabel(user);

  const handleBack = () => {
    goToPreviousPage(history);
  };

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
        brandLeading="back"
        brandTrailing="user"
        onBack={handleBack}
        onProfile={() => history.push('/profile')}
        title="My Profile"
        variant="brand"
      />
      <IonContent className="ctl-account-content" fullscreen>
        <main className="ctl-account">
          <section className="ctl-profile-shell">
            <article className="ctl-profile-card">
              <div className="ctl-profile-avatar-wrap">
                <div
                  aria-label={`${fullName} profile avatar`}
                  className={`ctl-profile-avatar${isGuest ? ' ctl-profile-avatar--guest' : ''}`}
                >
                  {isGuest ? <IonIcon icon={personCircleOutline} /> : getUserInitials(user)}
                </div>
                {!isGuest ? (
                  <button aria-label="Change profile photo" className="ctl-profile-camera" type="button">
                    <IonIcon icon={cameraOutline} />
                  </button>
                ) : null}
              </div>

              <div className="ctl-profile-name">
                <h2>{isGuest ? 'Guest' : fullName}</h2>
                <p>{isGuest ? 'You are browsing as guest.' : email}</p>
              </div>

              <div className="ctl-profile-divider" />

              {isGuest ? (
                <div className="ctl-profile-auth-actions">
                  <button
                    className="ctl-profile-auth-button ctl-profile-auth-button--primary"
                    onClick={() => history.push('/login')}
                    type="button"
                  >
                    <IonIcon icon={logInOutline} />
                    Login
                  </button>
                  <button
                    className="ctl-profile-auth-button"
                    onClick={() => history.push('/register')}
                    type="button"
                  >
                    <IonIcon icon={personAddOutline} />
                    Register
                  </button>
                </div>
              ) : (
                <button className="ctl-logout-button" onClick={handleLogout} type="button">
                  <IonIcon icon={logOutOutline} />
                  Logout
                </button>
              )}
            </article>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
