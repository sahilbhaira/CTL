import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  arrowBackOutline,
  eyeOffOutline,
  lockClosedOutline,
  mailOutline,
  personOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import AuthField from '../components/auth/AuthField';
import './auth.css';

const Register: React.FC = () => {
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
              <h1>Register</h1>
            </header>

            <section className="ctl-auth-heading">
              <h2>Create an Account</h2>
              <p>Join Chandigarh Trade Link today</p>
            </section>

            <form className="ctl-auth-form ctl-auth-form--large-gap">
              <AuthField
                autoComplete="name"
                icon={personOutline}
                placeholder="Full Name"
              />
              <AuthField
                autoComplete="email"
                icon={mailOutline}
                placeholder="Email"
                type="email"
              />
              <AuthField
                autoComplete="new-password"
                endIcon={eyeOffOutline}
                icon={lockClosedOutline}
                placeholder="Password"
                type="password"
              />
              <AuthField
                autoComplete="new-password"
                endIcon={eyeOffOutline}
                icon={lockClosedOutline}
                placeholder="Confirm Password"
                type="password"
              />
            </form>

            <IonButton
              className="ctl-auth-primary"
              onClick={() => history.push('/home')}
            >
              CREATE ACCOUNT
            </IonButton>

            <div className="ctl-auth-bottom-link">
              Already have an account?
              <button
                className="ctl-auth-inline-link"
                onClick={() => history.push('/login')}
                type="button"
              >
                Login
              </button>
            </div>
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Register;
