import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import { arrowBackOutline, keyOutline, mailOutline } from 'ionicons/icons';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useHistory } from 'react-router';
import AuthField from '../../components/auth/AuthField';
import { authService } from '../../services/authService';
import './auth.css';

interface ForgotPasswordValues {
  email: string;
}

type SubmitMessage = {
  text: string;
  type: 'error' | 'success';
};

const validateForgotPassword = (values: ForgotPasswordValues) => {
  const errors: Partial<ForgotPasswordValues> = {};

  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'Enter a valid email';
  }

  return errors;
};

const ForgotPassword: React.FC = () => {
  const history = useHistory();
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);

  const formik = useFormik<ForgotPasswordValues>({
    initialValues: {
      email: ''
    },
    onSubmit: async (values) => {
      setSubmitMessage(null);

      try {
        await authService.sendPasswordReset(values.email);
        setSubmitMessage({
          text: 'Reset link sent. Please check your email to continue.',
          type: 'success'
        });
      } catch (error) {
        setSubmitMessage({
          text: error instanceof Error ? error.message : 'Unable to send reset link right now',
          type: 'error'
        });
      }
    },
    validate: validateForgotPassword
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
              <h1>Forgot Password</h1>
            </header>

            <section className="ctl-auth-heading">
              <div className="ctl-auth-symbol">
                <IonIcon icon={keyOutline} />
              </div>
              <h2>Reset Password</h2>
              <p>Enter your email address and we will send you a link to reset your password.</p>
            </section>

            <form
              className="ctl-auth-form ctl-auth-form--large-gap"
              noValidate
              onSubmit={formik.handleSubmit}
            >
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
                {formik.isSubmitting ? 'SENDING...' : 'SEND RESET LINK'}
              </IonButton>
            </form>
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
