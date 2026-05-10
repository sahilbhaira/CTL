import type { FC } from 'react';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import {
  arrowBackOutline,
  menuOutline,
  personOutline,
  shareSocialOutline
} from 'ionicons/icons';
import './AppHeader.css';

interface Props {
  title: string;
  showBack?: boolean;
  variant?: 'default' | 'brand';
  brandLeading?: 'menu' | 'back';
  brandTrailing?: 'avatar' | 'share' | 'user';
  onBack?: () => void;
  onProfile?: () => void;
  onShare?: () => void;
  userInitials?: string;
}

const AppHeader: FC<Props> = ({
  title,
  brandLeading = 'menu',
  brandTrailing = 'avatar',
  onBack,
  onProfile,
  onShare,
  showBack,
  variant = 'default',
  userInitials = 'RS'
}) => {
  const [brandName, ...brandRest] = title.split(' ');
  const brandSubtitle = brandRest.join(' ') || 'Trade Link';

  if (variant === 'brand') {
    return (
      <IonHeader className="ctl-app-header ctl-app-header--brand">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              aria-label={brandLeading === 'back' ? 'Go back' : 'Open menu'}
              className="ctl-header-button"
              fill="clear"
              onClick={brandLeading === 'back' ? onBack : undefined}
            >
              <IonIcon
                icon={brandLeading === 'back' ? arrowBackOutline : menuOutline}
                slot="icon-only"
              />
            </IonButton>
          </IonButtons>

          <IonTitle className="ctl-brand-title">
            <div className="ctl-brand-lockup">
              <div className="ctl-brand-mark">CTL</div>
              <div className="ctl-brand-copy">
                <span>{brandName}</span>
                <small>{brandSubtitle}</small>
              </div>
            </div>
          </IonTitle>

          <IonButtons slot="end">
            {brandTrailing === 'share' ? (
              <IonButton
                aria-label="Share product"
                className="ctl-header-button"
                fill="clear"
                onClick={onShare}
              >
                <IonIcon icon={shareSocialOutline} slot="icon-only" />
              </IonButton>
            ) : brandTrailing === 'user' ? (
              <IonButton
                aria-label="Open profile"
                className="ctl-header-button"
                fill="clear"
                onClick={onProfile}
              >
                <IonIcon icon={personOutline} slot="icon-only" />
              </IonButton>
            ) : (
              <div aria-label="Current user" className="ctl-user-avatar">
                {userInitials}
              </div>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>
    );
  }

  return (
    <IonHeader className="ctl-app-header">
      <IonToolbar>
        <IonButtons slot="start">
          {showBack ? <IonBackButton defaultHref="/home" /> : <IonMenuButton />}
        </IonButtons>

        <IonTitle>{title}</IonTitle>
      </IonToolbar>
    </IonHeader>
  );
};

export default AppHeader;
