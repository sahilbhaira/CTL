import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage
} from '@ionic/react';
import {
  eyeOffOutline,
  lockClosedOutline,
  mailOutline,
  personOutline
} from 'ionicons/icons';
import AppLogo from '../../assets/images/ctl_logo.png';
import type { User } from '@supabase/supabase-js';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useHistory } from 'react-router';
import AuthField from '../../components/auth/AuthField';
import { isAdminUser } from '../../lib/admin';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import './auth.css';

interface LoginValues {
  email: string;
  password: string;
}

type SubmitMessage = {
  text: string;
  type: 'error' | 'success';
};

const validateLogin = (values: LoginValues) => {
  const errors: Partial<LoginValues> = {};

  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'Enter a valid email';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  }

  return errors;
};

const getPostLoginPath = (user: User | null) =>
  isAdminUser(user) ? '/admin/dashboard' : '/home';

const Login: React.FC = () => {
  const history = useHistory();
  const session = useAuthStore((state) => state.session);
  const setGuestSession = useAuthStore((state) => state.setGuestSession);
  const setSession = useAuthStore((state) => state.setSession);
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);

  const formik = useFormik<LoginValues>({
    initialValues: {
      email: '',
      password: ''
    },
    onSubmit: async (values) => {
      setSubmitMessage(null);

      try {
        const { session } = await authService.login(values);
        setSession(session);
        history.replace(getPostLoginPath(session?.user ?? null));
      } catch (error) {
        setSubmitMessage({
          text: error instanceof Error ? error.message : 'Unable to login right now',
          type: 'error'
        });
      }
    },
    validate: validateLogin
  });

  const handleGuestEntry = async () => {
    if (session) {
      await authService.logout();
    }

    setGuestSession();
    history.replace('/home');
  };

  return (
    <IonPage>
      <IonContent className="ctl-auth-content" fullscreen>
        <main className="ctl-auth-screen">
          <div className="ctl-auth-panel ctl-login-panel">
            <section className="ctl-auth-logo-block">
              <div className="ctl-auth--login-logo"><img width={100} src={AppLogo} /></div>
              <h1>Chandigarh Trade Link</h1>
            </section>

            {/* <section className="ctl-auth-intro">
              <h2>Get Professional Work Done</h2>
              <p>with Verified Experts</p>
            </section> */}

            <IonButton
              className="ctl-auth-secondary"
              onClick={handleGuestEntry}
            >
              <IonIcon icon={personOutline} />
              CONTINUE AS GUEST
            </IonButton>

            <div className="ctl-auth-divider">
              <span>OR</span>
            </div>

            <form className="ctl-auth-form" noValidate onSubmit={formik.handleSubmit}>
              <AuthField
                autoComplete="email"
                error={formik.errors.email}
                icon={mailOutline}
                name="email"
                onBlur={() => formik.setFieldTouched('email', true)}
                onValueChange={(value) => formik.setFieldValue('email', value)}
                placeholder="Email"
                touched={formik.touched.email}
                type="email"
                value={formik.values.email}
              />
              <AuthField
                autoComplete="current-password"
                endIcon={eyeOffOutline}
                error={formik.errors.password}
                icon={lockClosedOutline}
                name="password"
                onBlur={() => formik.setFieldTouched('password', true)}
                onValueChange={(value) => formik.setFieldValue('password', value)}
                placeholder="Password"
                touched={formik.touched.password}
                type="password"
                value={formik.values.password}
              />

              {submitMessage ? (
                <p className={`ctl-auth-message ctl-auth-message--${submitMessage.type}`}>
                  {submitMessage.text}
                </p>
              ) : null}

              <IonButton
                className="ctl-auth-primary"
                disabled={formik.isSubmitting}
                type="submit"
              >
                {formik.isSubmitting ? 'LOGGING IN...' : 'LOGIN'}
              </IonButton>
            </form>

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
