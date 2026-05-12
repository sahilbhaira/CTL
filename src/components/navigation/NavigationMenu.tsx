import {
  IonContent,
  IonIcon,
  IonMenu,
  IonMenuToggle
} from '@ionic/react';
import {
  callOutline,
  chatbubbleEllipsesOutline,
  checkmarkDoneCircleOutline,
  closeOutline,
  documentTextOutline,
  gridOutline,
  helpCircleOutline,
  homeOutline,
  informationCircleOutline,
  listOutline,
  logInOutline,
  logOutOutline,
  peopleOutline,
  personOutline,
  speedometerOutline
} from 'ionicons/icons';
import { useRef, type FC, type MouseEvent } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  getUserDisplayName,
  getUserEmailLabel,
  getUserInitials
} from '../../lib/userProfile';
import { isAdminUser } from '../../lib/admin';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import './NavigationMenu.css';

interface NavigationMenuProps {
  contentId: string;
}

interface MenuItemConfig {
  icon: string;
  label: string;
  path?: string;
}

const mainMenuItems: MenuItemConfig[] = [
  { icon: homeOutline, label: 'Home', path: '/home' },
  { icon: gridOutline, label: 'Services', path: '/services' },
  { icon: documentTextOutline, label: 'Request Quotation', path: '/quote' },
  { icon: listOutline, label: 'My Quotes', path: '/quotes' },
  { icon: callOutline, label: 'Contact Us', path: '/contact' }
];

const guestMenuItems = mainMenuItems.filter((item) => item.path !== '/quotes');

const adminMenuItems: MenuItemConfig[] = [
  { icon: speedometerOutline, label: 'Admin Dashboard', path: '/admin/dashboard' },
  { icon: peopleOutline, label: 'Leads', path: '/admin/leads' },
  { icon: documentTextOutline, label: 'Create Quote', path: '/admin/quote-preview' },
  { icon: chatbubbleEllipsesOutline, label: 'Negotiations', path: '/admin/negotiations' },
  { icon: checkmarkDoneCircleOutline, label: 'Accepted Quotes', path: '/admin/accepted' }
];

const otherMenuItems: MenuItemConfig[] = [
  { icon: informationCircleOutline, label: 'About Us' },
  { icon: helpCircleOutline, label: 'Help / FAQs' }
];

const hideMenuElement = (menu: HTMLIonMenuElement | null) => {
  menu?.classList.remove('show-menu');
  document.querySelectorAll('.menu-content-open').forEach((element) => {
    element.classList.remove('menu-content-open');
    element.removeAttribute('aria-hidden');
  });
};

const isItemActive = (pathname: string, path?: string) => {
  if (!path) {
    return false;
  }

  if (path === '/services') {
    return pathname.startsWith('/services') || pathname.startsWith('/products');
  }

  if (path === '/quotes') {
    return pathname === '/quotes' || pathname === '/status';
  }

  return pathname === path;
};

const NavigationMenu: FC<NavigationMenuProps> = ({ contentId }) => {
  const history = useHistory();
  const location = useLocation();
  const clearSession = useAuthStore((state) => state.clearSession);
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const menuRef = useRef<HTMLIonMenuElement>(null);
  const isGuest = !user;
  const isAdmin = isAdminUser(user);
  const displayName = getUserDisplayName(user);
  const emailLabel = getUserEmailLabel(user);
  const visibleMenuItems = isAdmin ? adminMenuItems : isGuest ? guestMenuItems : mainMenuItems;

  const closeMenu = async (menuToClose?: HTMLIonMenuElement | null) => {
    const menu =
      menuToClose ??
      menuRef.current ??
      (document.querySelector('ion-menu[menu-id="main-menu"]') as HTMLIonMenuElement | null) ??
      (document.querySelector('ion-menu') as HTMLIonMenuElement | null);

    await menu?.close();
    await menu?.setOpen(false, false);
    hideMenuElement(menu ?? null);
  };

  const navigateTo = (path: string, event?: MouseEvent<HTMLElement>) => {
    const currentMenu = event?.currentTarget.closest('ion-menu') as HTMLIonMenuElement | null;

    void closeMenu(currentMenu).finally(() => {
      history.push(path);
    });
  };

  const handleLogout = async () => {
    if (session) {
      await authService.logout();
    }

    clearSession();
    await closeMenu();
    history.replace('/login');
  };

  return (
    <IonMenu
      className="ctl-navigation-menu"
      contentId={contentId}
      menuId="main-menu"
      ref={menuRef}
      side="start"
      type="overlay"
    >
      <IonContent className="ctl-navigation-menu__content" scrollY>
        <aside className="ctl-navigation-drawer" aria-label="Main navigation">
          <section className={`ctl-navigation-profile${isGuest ? ' ctl-navigation-profile--guest' : ''}`}>
            <button
              aria-label="Close menu"
              className="ctl-navigation-close"
              onClick={() => closeMenu()}
              type="button"
            >
              <IonIcon icon={closeOutline} />
            </button>

            <div className="ctl-navigation-avatar" aria-hidden="true">
              {isGuest ? <IonIcon icon={personOutline} /> : getUserInitials(user)}
            </div>

            <h2>{isGuest ? 'Guest User' : displayName}</h2>
            <p>
              {isGuest
                ? 'You are browsing as guest'
                : isAdmin
                  ? 'Administrator access'
                  : emailLabel}
            </p>

            {isGuest ? (
              <IonMenuToggle
                autoHide={false}
                menu="main-menu"
              >
                <button
                  className="ctl-navigation-auth"
                  onClick={(event) => navigateTo('/login', event)}
                  type="button"
                >
                  <IonIcon icon={logInOutline} />
                  LOGIN / REGISTER
                </button>
              </IonMenuToggle>
            ) : null}
          </section>

          <nav className="ctl-navigation-scroll" aria-label="App sections">
            <section className="ctl-navigation-section">
              <h3>Main Menu</h3>
              {visibleMenuItems.map((item) => (
                <IonMenuToggle
                  autoHide={false}
                  key={item.label}
                  menu="main-menu"
                >
                  <button
                    className={`ctl-navigation-item${
                      isItemActive(location.pathname, item.path)
                        ? ' ctl-navigation-item--active'
                        : ''
                    }`}
                    onClick={(event) => item.path && navigateTo(item.path, event)}
                    type="button"
                  >
                    <span>
                      <IonIcon icon={item.icon} />
                    </span>
                    <strong>{item.label}</strong>
                  </button>
                </IonMenuToggle>
              ))}
            </section>

            {!isAdmin ? (
              <section className="ctl-navigation-section">
                <h3>Other</h3>
                {otherMenuItems.map((item) => (
                  <button className="ctl-navigation-item" key={item.label} type="button">
                    <span>
                      <IonIcon icon={item.icon} />
                    </span>
                    <strong>{item.label}</strong>
                  </button>
                ))}
              </section>
            ) : null}

            {!isGuest ? (
              <section className="ctl-navigation-section ctl-navigation-section--account">
                <h3>Account</h3>
                <button
                  className="ctl-navigation-item ctl-navigation-item--danger"
                  onClick={handleLogout}
                  type="button"
                >
                  <span>
                    <IonIcon icon={logOutOutline} />
                  </span>
                  <strong>Logout</strong>
                </button>
              </section>
            ) : null}
          </nav>

          <footer className="ctl-navigation-footer">Version 1.0.0</footer>
        </aside>
      </IonContent>
    </IonMenu>
  );
};

export default NavigationMenu;
