import { IonIcon } from '@ionic/react';
import {
  closeOutline,
  documentTextOutline,
  logInOutline,
  personAddOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import { useQuoteAccessStore } from '../../store/quoteAccessStore';
import './QuoteLoginPrompt.css';

const QuoteLoginPrompt: React.FC = () => {
  const history = useHistory();
  const closeLoginPrompt = useQuoteAccessStore((state) => state.closeLoginPrompt);
  const isLoginPromptOpen = useQuoteAccessStore((state) => state.isLoginPromptOpen);
  const requestedPath = useQuoteAccessStore((state) => state.requestedPath);

  if (!isLoginPromptOpen) {
    return null;
  }

  const openLogin = () => {
    const from = requestedPath ?? '/quote';
    closeLoginPrompt();
    history.push('/login', { from });
  };

  const openRegister = () => {
    const from = requestedPath ?? '/quote';
    closeLoginPrompt();
    history.push('/register', { from });
  };

  return (
    <div aria-modal="true" className="ctl-quote-login-modal" role="dialog">
      <div className="ctl-quote-login-modal__card">
        <button
          aria-label="Close login prompt"
          className="ctl-quote-login-modal__close"
          onClick={closeLoginPrompt}
          type="button"
        >
          <IonIcon icon={closeOutline} />
        </button>

        <span className="ctl-quote-login-modal__icon">
          <IonIcon icon={documentTextOutline} />
        </span>
        <h2>Login required for quotes</h2>
        <p>
          For quotes you have to login first. If you don't have an account,
          please register.
        </p>

        <div className="ctl-quote-login-modal__actions">
          <button
            className="ctl-quote-login-modal__button ctl-quote-login-modal__button--primary"
            onClick={openLogin}
            type="button"
          >
            <IonIcon icon={logInOutline} />
            Login
          </button>
          <button
            className="ctl-quote-login-modal__button"
            onClick={openRegister}
            type="button"
          >
            <IonIcon icon={personAddOutline} />
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteLoginPrompt;
