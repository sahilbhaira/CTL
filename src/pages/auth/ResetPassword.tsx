import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  alertCircleOutline,
  eyeOffOutline,
  lockClosedOutline,
  reloadOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import AuthField from '../../components/auth/AuthField';
import { authService, hasAuthRedirectParams } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import './auth.css';

interface ResetPasswordValues {
  confirmPassword: string;
  password: string;
}

type SubmitMessage = {
  text: string;
  type: 'error' | 'success';
};

const validateResetPassword = (values: ResetPasswordValues) => {
  const errors: Partial<ResetPasswordValues> = {};

  if (!values.password) {
    errors.password = 'New password is required';
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

const ResetPassword: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const [isPreparingSession, setIsPreparingSession] = useState(() =>
    hasAuthRedirectParams(location.search, location.hash)
  );
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);

  useEffect(() => {
    if (!isPreparingSession) {
      return undefined;
    }

    let isMounted = true;

    const prepareRecoverySession = async () => {
      try {
        const recoverySession = await authService.completeEmailRedirect(
          location.search,
          location.hash
        );

        if (!isMounted) {
          return;
        }

        setSession(recoverySession);
        history.replace('/reset-password');
        setIsPreparingSession(false);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSubmitMessage({
          text:
            error instanceof Error
              ? error.message
              : 'Unable to verify this reset link.',
          type: 'error'
        });
        setIsPreparingSession(false);
      }
    };

    void prepareRecoverySession();

    return () => {
      isMounted = false;
    };
  }, [
    history,
    isPreparingSession,
    location.hash,
    location.search,
    setSession
  ]);

  const formik = useFormik<ResetPasswordValues>({
    initialValues: {
      confirmPassword: '',
      password: ''
    },
    onSubmit: async (values) => {
      setSubmitMessage(null);

      try {
        await authService.updatePassword(values.password);
        setSubmitMessage({
          text: 'Password updated successfully.',
          type: 'success'
        });
        window.setTimeout(() => {
          history.replace('/home');
        }, 600);
      } catch (error) {
        setSubmitMessage({
          text:
            error instanceof Error
              ? error.message
              : 'Unable to update your password right now',
          type: 'error'
        });
      }
    },
    validate: validateResetPassword
  });

  return (
    <IonPage>
      <IonContent className="ctl-auth-content" fullscreen>
        <main className="ctl-auth-screen">
          <div className="ctl-auth-panel ctl-login-panel">
            <section className="ctl-auth-heading">
              <div
                className={`ctl-auth-symbol ctl-auth-symbol--reverse${
                  submitMessage?.type === 'error' && !session
                    ? ' ctl-auth-symbol--error'
                    : ''
                }`}
              >
                <IonIcon
                  icon={
                    isPreparingSession
                      ? reloadOutline
                      : submitMessage?.type === 'error' && !session
                        ? alertCircleOutline
                        : lockClosedOutline
                  }
                />
              </div>
              <h1>Reset Password</h1>
              <p>
                {isPreparingSession
                  ? 'Verifying your password reset link...'
                  : 'Please create a new password that you do not use on any other site.'}
              </p>
            </section>

            {isPreparingSession ? null : !session ? (
              <div className="ctl-auth-form ctl-auth-form--large-gap">
                {submitMessage ? (
                  <p className={`ctl-auth-message ctl-auth-message--${submitMessage.type}`}>
                    {submitMessage.text}
                  </p>
                ) : (
                  <p className="ctl-auth-message ctl-auth-message--error">
                    Please open the latest reset link from your email.
                  </p>
                )}

                <IonButton
                  className="ctl-auth-primary"
                  onClick={() => history.replace('/forgot-password')}
                >
                  REQUEST NEW LINK
                </IonButton>
              </div>
            ) : (
            <form
              className="ctl-auth-form ctl-auth-form--large-gap"
              noValidate
              onSubmit={formik.handleSubmit}
            >
              <AuthField
                autoComplete="new-password"
                endIcon={eyeOffOutline}
                error={formik.errors.password}
                icon={lockClosedOutline}
                name="password"
                onBlur={() => formik.setFieldTouched('password', true)}
                onValueChange={(value) => formik.setFieldValue('password', value)}
                placeholder="New Password"
                touched={formik.touched.password}
                type="password"
                value={formik.values.password}
              />
              <AuthField
                autoComplete="new-password"
                endIcon={eyeOffOutline}
                error={formik.errors.confirmPassword}
                icon={shieldCheckmarkOutline}
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
                {formik.isSubmitting ? 'UPDATING...' : 'UPDATE PASSWORD'}
              </IonButton>
            </form>
            )}
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;
