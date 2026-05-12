import { IonIcon, IonModal } from '@ionic/react';
import { checkmarkCircleOutline, listOutline } from 'ionicons/icons';
import type { FC } from 'react';

interface QuoteSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToQuotes: () => void;
  referenceId?: string | null;
}

const QuoteSuccessModal: FC<QuoteSuccessModalProps> = ({
  isOpen,
  onClose,
  onGoToQuotes,
  referenceId
}) => (
  <IonModal
    className="ctl-quote-success-modal"
    isOpen={isOpen}
    onDidDismiss={onClose}
  >
    <section
      aria-labelledby="quote-success-title"
      aria-modal="true"
      className="ctl-quote-success-card"
      role="dialog"
    >
      <div className="ctl-quote-success-icon" aria-hidden="true">
        <span />
        <IonIcon icon={checkmarkCircleOutline} />
      </div>

      <h2 id="quote-success-title">Request Sent!</h2>
      <p>
        Your quotation request has been submitted successfully. Our team will get
        back to you shortly.
      </p>

      <div className="ctl-quote-reference">
        <span>Reference ID</span>
        <strong>{referenceId ?? 'QT-PENDING'}</strong>
      </div>

      <button className="ctl-quote-success-action" onClick={onGoToQuotes} type="button">
        <IonIcon icon={listOutline} />
        GO TO MY QUOTES
      </button>
    </section>
  </IonModal>
);

export default QuoteSuccessModal;
