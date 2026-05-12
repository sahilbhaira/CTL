import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  arrowBackOutline,
  eyeOffOutline,
  lockClosedOutline,
  mailOutline,
  personOutline
} from 'ionicons/icons';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useHistory } from 'react-router';
import AuthField from '../../components/auth/AuthField';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import './auth.css';

interface RegisterValues {
  confirmPassword: string;
  email: string;
  fullName: string;
  password: string;
}

type SubmitMessage = {
  text: string;
  type: 'error' | 'success';
};

const validateRegister = (values: RegisterValues) => {
  const errors: Partial<RegisterValues> = {};

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required';
  }

  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'Enter a valid email';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

const Register: React.FC = () => {
  const history = useHistory();
  const setSession = useAuthStore((state) => state.setSession);
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);

  const formik = useFormik<RegisterValues>({
    initialValues: {
      confirmPassword: '',
      email: '',
      fullName: '',
      password: ''
    },
    onSubmit: async (values) => {
      setSubmitMessage(null);

      try {
        const { session } = await authService.register({
          email: values.email,
          fullName: values.fullName,
          password: values.password
        });

        if (session) {
          setSession(session);
          history.replace('/home');
          return;
        }

        setSubmitMessage({
          text: 'Account created. Please check your email to confirm your account.',
          type: 'success'
        });
      } catch (error) {
        setSubmitMessage({
          text: error instanceof Error ? error.message : 'Unable to create account right now',
          type: 'error'
        });
      }
    },
    validate: validateRegister
  });

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

            <form
              className="ctl-auth-form ctl-auth-form--large-gap"
              noValidate
              onSubmit={formik.handleSubmit}
            >
              <AuthField
                autoComplete="name"
                error={formik.errors.fullName}
                icon={personOutline}
                name="fullName"
                onBlur={() => formik.setFieldTouched('fullName', true)}
                onValueChange={(value) => formik.setFieldValue('fullName', value)}
                placeholder="Full Name"
                touched={formik.touched.fullName}
                value={formik.values.fullName}
              />
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
                autoComplete="new-password"
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
              <AuthField
                autoComplete="new-password"
                endIcon={eyeOffOutline}
                error={formik.errors.confirmPassword}
                icon={lockClosedOutline}
                name="confirmPassword"
                onBlur={() => formik.setFieldTouched('confirmPassword', true)}
                onValueChange={(value) => formik.setFieldValue('confirmPassword', value)}
                placeholder="Confirm Password"
                touched={formik.touched.confirmPassword}
                type="password"
                value={formik.values.confirmPassword}
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
                {formik.isSubmitting ? 'CREATING...' : 'CREATE ACCOUNT'}
              </IonButton>
            </form>

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
