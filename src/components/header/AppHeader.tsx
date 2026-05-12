import { useEffect, useRef, useState, type FC } from 'react';
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
import { getUserInitials } from '../../lib/userProfile';
import { useAuthStore } from '../../store/authStore';
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
  userInitials = 'GU'
}) => {
  const history = useHistory();
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
  const [brandName, ...brandRest] = title.split(' ');
  const brandSubtitle = brandRest.join(' ') || 'Trade Link';
  const isGuestAccount = !user;
  const accountInitials = getUserInitials(user, userInitials);

  useEffect(() => {
    if (!isGuestMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsGuestMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isGuestMenuOpen]);

  const openAuthRoute = (path: '/login' | '/register') => {
    setIsGuestMenuOpen(false);
    history.push(path);
  };

  const handleAccountClick = () => {
    if (isGuestAccount) {
      setIsGuestMenuOpen((isOpen) => !isOpen);
      return;
    }

    if (onProfile) {
      onProfile();
      return;
    }

    history.push('/profile');
  };

  const renderAccountControl = () => {
    if (isGuestAccount) {
      return (
        <div className="ctl-account-menu" ref={menuRef}>
          <button
            aria-expanded={isGuestMenuOpen}
            aria-label="Guest account menu"
            className="ctl-guest-account"
            onClick={handleAccountClick}
            type="button"
          >
            <span className="ctl-guest-account__icon">
              <IonIcon icon={personOutline} />
            </span>
            <span className="ctl-guest-account__label">GUEST</span>
          </button>

          {isGuestMenuOpen ? (
            <div className="ctl-account-dropdown">
              <button onClick={() => openAuthRoute('/login')} type="button">
                Login
              </button>
              <button onClick={() => openAuthRoute('/register')} type="button">
                Register
              </button>
            </div>
          ) : null}
        </div>
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
                onClick={onBack}
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
            <IonBackButton defaultHref="/home" />
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
