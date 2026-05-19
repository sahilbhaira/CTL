import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  reloadOutline
} from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import { isAdminUser } from '../../lib/admin';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import './auth.css';

type CallbackState = 'error' | 'loading' | 'success';

const AuthCallback: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const [callbackState, setCallbackState] = useState<CallbackState>('loading');
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    let isMounted = true;

    const completeRedirect = async () => {
      try {
        const session = await authService.completeEmailRedirect(
          location.search,
          location.hash
        );

        if (!isMounted) {
          return;
        }

        setSession(session);
        setCallbackState('success');
        setMessage('Email confirmed successfully.');

        window.setTimeout(() => {
          history.replace(isAdminUser(session?.user ?? null) ? '/admin/dashboard' : '/home');
        }, 700);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCallbackState('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Unable to confirm this email link.'
        );
      }
    };

    void completeRedirect();

    return () => {
      isMounted = false;
    };
  }, [history, location.hash, location.search, setSession]);

  return (
    <IonPage>
      <IonContent className="ctl-auth-content" fullscreen>
        <main className="ctl-auth-screen">
          <div className="ctl-auth-panel ctl-login-panel">
            <section className="ctl-auth-heading">
              <div
                className={`ctl-auth-symbol${
                  callbackState === 'error' ? ' ctl-auth-symbol--error' : ''
                }`}
              >
                <IonIcon
                  icon={
                    callbackState === 'error'
                      ? alertCircleOutline
                      : callbackState === 'success'
                        ? checkmarkCircleOutline
                        : reloadOutline
                  }
                />
              </div>
              <h1>
                {callbackState === 'error'
                  ? 'Link Not Verified'
                  : callbackState === 'success'
                    ? 'Email Confirmed'
                    : 'Confirming Email'}
              </h1>
              <p>{message}</p>
            </section>

            {callbackState === 'error' ? (
              <IonButton
                className="ctl-auth-primary"
                onClick={() => history.replace('/login')}
              >
                BACK TO LOGIN
              </IonButton>
            ) : null}
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default AuthCallback;
