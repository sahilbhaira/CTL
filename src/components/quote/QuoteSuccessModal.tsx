import { IonIcon, IonModal } from '@ionic/react';
import { checkmarkCircleOutline, closeOutline, listOutline } from 'ionicons/icons';
import type { FC } from 'react';
import '../../pages/quote/quote.css';

interface QuoteSuccessModalProps {
  actionIcon?: string;
  actionLabel?: string;
  closeLabel?: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  onGoToQuotes?: () => void;
  referenceLabel?: string;
  referenceId?: string | null;
  title?: string;
}

const QuoteSuccessModal: FC<QuoteSuccessModalProps> = ({
  actionIcon = listOutline,
  actionLabel = 'GO TO TRACK',
  closeLabel = 'Close quote success',
  description = 'Your quotation request has been submitted successfully. Our team will get back to you shortly.',
  isOpen,
  onClose,
  onGoToQuotes,
  referenceId,
  referenceLabel = 'Reference ID',
  title = 'Request Sent!'
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
      <button
        aria-label={closeLabel}
        className="ctl-quote-success-close"
        onClick={onClose}
        type="button"
      >
        <IonIcon icon={closeOutline} />
      </button>

      <div className="ctl-quote-success-icon" aria-hidden="true">
        <span />
        <IonIcon icon={checkmarkCircleOutline} />
      </div>

      <h2 id="quote-success-title">{title}</h2>
      <p>{description}</p>

      <div className="ctl-quote-reference">
        <span>{referenceLabel}</span>
        <strong>{referenceId ?? 'QT-PENDING'}</strong>
      </div>

      {onGoToQuotes ? (
        <button className="ctl-quote-success-action" onClick={onGoToQuotes} type="button">
          <IonIcon icon={actionIcon} />
          {actionLabel}
        </button>
      ) : null}
    </section>
  </IonModal>
);

export default QuoteSuccessModal;
