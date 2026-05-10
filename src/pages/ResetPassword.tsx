import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  eyeOffOutline,
  lockClosedOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import AuthField from '../components/auth/AuthField';
import './auth.css';

const ResetPassword: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="ctl-auth-content" fullscreen>
        <main className="ctl-auth-screen">
          <div className="ctl-auth-panel ctl-login-panel">
            <section className="ctl-auth-heading">
              <div className="ctl-auth-symbol ctl-auth-symbol--reverse">
                <IonIcon icon={lockClosedOutline} />
              </div>
              <h1>Reset Password</h1>
              <p>Please create a new password that you don't use on any other site.</p>
            </section>

            <form className="ctl-auth-form ctl-auth-form--large-gap">
              <AuthField
                autoComplete="new-password"
                endIcon={eyeOffOutline}
                icon={lockClosedOutline}
                placeholder="New Password"
                type="password"
              />
              <AuthField
                autoComplete="new-password"
                endIcon={eyeOffOutline}
                icon={shieldCheckmarkOutline}
                placeholder="Confirm Password"
                type="password"
              />
            </form>

            <IonButton
              className="ctl-auth-primary"
              onClick={() => history.push('/home')}
            >
              UPDATE PASSWORD
            </IonButton>
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;
