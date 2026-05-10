import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import { arrowBackOutline, keyOutline, mailOutline } from 'ionicons/icons';
import { useHistory } from 'react-router';
import AuthField from '../components/auth/AuthField';
import './auth.css';

const ForgotPassword: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="ctl-auth-content" fullscreen>
        <main className="ctl-auth-screen">
          <div className="ctl-auth-panel">
            <header className="ctl-auth-topbar">
              <IonButton
                aria-label="Back to login"
                className="ctl-auth-back"
                onClick={() => history.push('/login')}
              >
                <IonIcon icon={arrowBackOutline} slot="icon-only" />
              </IonButton>
              <h1>Forgot Password</h1>
            </header>

            <section className="ctl-auth-heading">
              <div className="ctl-auth-symbol">
                <IonIcon icon={keyOutline} />
              </div>
              <h2>Reset Password</h2>
              <p>Enter your email address and we will send you a link to reset your password.</p>
            </section>

            <form className="ctl-auth-form ctl-auth-form--large-gap">
              <AuthField
                autoComplete="email"
                icon={mailOutline}
                placeholder="Email"
                type="email"
              />
            </form>

            <IonButton
              className="ctl-auth-primary"
              onClick={() => history.push('/reset-password')}
            >
              SEND RESET LINK
            </IonButton>
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
