import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  eyeOffOutline,
  lockClosedOutline,
  mailOutline,
  personOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import AuthField from '../components/auth/AuthField';
import './auth.css';

const Login: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="ctl-auth-content" fullscreen>
        <main className="ctl-auth-screen">
          <div className="ctl-auth-panel ctl-login-panel">
            <section className="ctl-auth-logo-block">
              <div className="ctl-auth-logo">CTL</div>
              <h1>Chandigarh Trade Link</h1>
            </section>

            <section className="ctl-auth-intro">
              <h2>Get Professional Work Done</h2>
              <p>with Verified Experts</p>
            </section>

            <IonButton
              className="ctl-auth-secondary"
              onClick={() => history.push('/home')}
            >
              <IonIcon icon={personOutline} />
              CONTINUE AS GUEST
            </IonButton>

            <div className="ctl-auth-divider">
              <span>OR</span>
            </div>

            <form className="ctl-auth-form">
              <AuthField
                autoComplete="email"
                icon={mailOutline}
                placeholder="Email"
                type="email"
              />
              <AuthField
                autoComplete="current-password"
                endIcon={eyeOffOutline}
                icon={lockClosedOutline}
                placeholder="Password"
                type="password"
              />
            </form>

            <IonButton
              className="ctl-auth-primary"
              onClick={() => history.push('/home')}
            >
              LOGIN
            </IonButton>

            <div className="ctl-auth-links">
              <button
                className="ctl-auth-link"
                onClick={() => history.push('/forgot-password')}
                type="button"
              >
                Forgot Password?
              </button>

              <div className="ctl-auth-inline">
                Don't have an account?
                <button
                  className="ctl-auth-inline-link"
                  onClick={() => history.push('/register')}
                  type="button"
                >
                  Register
                </button>
              </div>
            </div>

            <footer className="ctl-auth-footer">
              <a href="/login">Terms</a>
              <span className="ctl-auth-dot" />
              <a href="/login">Privacy</a>
            </footer>
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Login;
