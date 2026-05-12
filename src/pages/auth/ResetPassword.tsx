import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  eyeOffOutline,
  lockClosedOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useHistory } from 'react-router';
import AuthField from '../../components/auth/AuthField';
import { authService } from '../../services/authService';
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
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);

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
        history.replace('/home');
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
              <div className="ctl-auth-symbol ctl-auth-symbol--reverse">
                <IonIcon icon={lockClosedOutline} />
              </div>
              <h1>Reset Password</h1>
              <p>Please create a new password that you don't use on any other site.</p>
            </section>

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
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;
