import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { cameraOutline, logOutOutline } from 'ionicons/icons';
import { useHistory } from 'react-router';
import AppHeader from '../components/header/AppHeader';
import './account.css';

const Profile: React.FC = () => {
  const history = useHistory();

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
                <div aria-label="Rajesh Kumar profile avatar" className="ctl-profile-avatar">
                  RK
                </div>
                <button aria-label="Change profile photo" className="ctl-profile-camera" type="button">
                  <IonIcon icon={cameraOutline} />
                </button>
              </div>

              <div className="ctl-profile-name">
                <h2>Rajesh Kumar</h2>
                <p>rajesh@gmail.com</p>
              </div>

              <div className="ctl-profile-divider" />

              <button className="ctl-logout-button" onClick={() => history.push('/login')} type="button">
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
