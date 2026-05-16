import { type FC } from 'react';
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
import { useHistory } from 'react-router';
import { goToPreviousPage } from '../../lib/navigation';
import { getUserInitials } from '../../lib/userProfile';
import { useAuthStore } from '../../store/authStore';
import './AppHeader.css';
import AppLogo from '../../assets/images/ctl_logo.png';

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
  userInitials = 'GU'
}) => {
  const history = useHistory();
  const user = useAuthStore((state) => state.user);
  const [brandName, ...brandRest] = title.split(' ');
  const brandSubtitle = brandRest.join(' ') || 'Trade Link';
  const isGuestAccount = !user;
  const accountInitials = getUserInitials(user, userInitials);
  const shouldShowPageTitle = variant === 'brand' && brandLeading === 'back';

  const handleAccountClick = () => {
    if (isGuestAccount) {
      history.push('/profile');
      return;
    }

    if (onProfile) {
      onProfile();
      return;
    }

    history.push('/profile');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    goToPreviousPage(history);
  };

  const renderAccountControl = () => {
    if (isGuestAccount) {
      return (
        <button
          aria-label="Open guest profile"
          className="ctl-guest-account"
          onClick={handleAccountClick}
          type="button"
        >
          <span className="ctl-guest-account__icon">
            <IonIcon icon={personOutline} />
          </span>
          <span className="ctl-guest-account__label">GUEST</span>
        </button>
      );
    }

    return (
      <IonButton
        aria-label="Open profile"
        className="ctl-header-button ctl-header-user-button"
        fill="clear"
        onClick={handleAccountClick}
      >
        <span className="ctl-user-avatar">{accountInitials}</span>
      </IonButton>
    );
  };

  if (variant === 'brand') {
    return (
      <IonHeader className="ctl-app-header ctl-app-header--brand">
        <IonToolbar>
          <IonButtons slot="start">
            {brandLeading === 'back' ? (
              <IonButton
                aria-label="Go back"
                className="ctl-header-button"
                fill="clear"
                onClick={handleBack}
              >
                <IonIcon icon={arrowBackOutline} slot="icon-only" />
              </IonButton>
            ) : (
              <IonMenuButton
                aria-label="Open menu"
                className="ctl-header-button"
                data-testid="main-menu-button"
                menu="main-menu"
              >
                <IonIcon icon={menuOutline} slot="icon-only" />
              </IonMenuButton>
            )}
          </IonButtons>

          <IonTitle className="ctl-brand-title">
            {shouldShowPageTitle ? (
              <span className="ctl-brand-page-title">{title}</span>
            ) : (
              <div className="ctl-brand-lockup">
                <div className="ctl-brand-mark"><img src={AppLogo} /></div>
                <div className="ctl-brand-copy">
                  <span>{brandName}</span>
                  <small>{brandSubtitle}</small>
                </div>
              </div>
            )}
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
            ) : (
              renderAccountControl()
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
          {showBack ? (
            <IonBackButton />
          ) : (
            <IonMenuButton data-testid="main-menu-button" menu="main-menu" />
          )}
        </IonButtons>

        <IonTitle>{title}</IonTitle>
      </IonToolbar>
    </IonHeader>
  );
};

export default AppHeader;
