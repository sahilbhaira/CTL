import type { FC } from 'react';
import { IonIcon } from '@ionic/react';
import {
  callOutline,
  documentTextOutline,
  folderOpenOutline,
  gridOutline,
  homeOutline,
  informationCircleOutline,
  layersOutline,
  listOutline
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router';
import {
  getProductPath,
  getQuotePath,
  type ProductTab
} from '../../data/servicesProducts';
import { useAuthStore } from '../../store/authStore';
import { useQuoteAccessStore } from '../../store/quoteAccessStore';
import './BottomNav.css';

type BottomNavProps =
  | {
      hidden?: boolean;
      variant: 'customer';
    }
  | {
      activeTab: ProductTab;
      hidden?: boolean;
      productId: string;
      variant: 'product';
    };

const productNavItems = [
  {
    icon: informationCircleOutline,
    id: 'overview',
    label: 'Overview'
  },
  {
    icon: listOutline,
    id: 'details',
    label: 'Details'
  },
  {
    icon: layersOutline,
    id: 'application',
    label: 'Application'
  },
  {
    icon: folderOpenOutline,
    id: 'document',
    label: 'Document'
  }
] as const;

const BottomNav: FC<BottomNavProps> = (props) => {
  const history = useHistory();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const openQuoteLoginPrompt = useQuoteAccessStore((state) => state.openLoginPrompt);

  if (props.hidden) {
    return null;
  }

  const openProtectedPath = (path: string) => {
    if (user) {
      history.push(path);
      return;
    }

    openQuoteLoginPrompt(path);
  };

  if (props.variant === 'product') {
    const quotePath = getQuotePath({ productId: props.productId });
    const openProductQuote = () => openProtectedPath(quotePath);

    return (
      <nav aria-label="Product navigation" className="ctl-bottom-nav">
        <button
          aria-current={props.activeTab === 'overview' ? 'page' : undefined}
          className={`ctl-bottom-nav__item${
            props.activeTab === 'overview' ? ' ctl-bottom-nav__item--active' : ''
          }`}
          onClick={() => history.push(getProductPath(props.productId, productNavItems[0].id))}
          type="button"
        >
          <IonIcon icon={productNavItems[0].icon} />
          <span>{productNavItems[0].label}</span>
        </button>

        <button
          aria-current={props.activeTab === 'details' ? 'page' : undefined}
          className={`ctl-bottom-nav__item${
            props.activeTab === 'details' ? ' ctl-bottom-nav__item--active' : ''
          }`}
          onClick={() => history.push(getProductPath(props.productId, productNavItems[1].id))}
          type="button"
        >
          <IonIcon icon={productNavItems[1].icon} />
          <span>{productNavItems[1].label}</span>
        </button>

        <button
          className="ctl-bottom-nav__quote"
          onClick={openProductQuote}
          type="button"
        >
          <span className="ctl-bottom-nav__quote-icon">
            <IonIcon icon={documentTextOutline} />
          </span>
          <span>QUOTE</span>
        </button>

        <button
          aria-current={props.activeTab === 'application' ? 'page' : undefined}
          className={`ctl-bottom-nav__item${
            props.activeTab === 'application' ? ' ctl-bottom-nav__item--active' : ''
          }`}
          onClick={() => history.push(getProductPath(props.productId, productNavItems[2].id))}
          type="button"
        >
          <IonIcon icon={productNavItems[2].icon} />
          <span>{productNavItems[2].label}</span>
        </button>

        <button
          aria-current={props.activeTab === 'document' ? 'page' : undefined}
          className={`ctl-bottom-nav__item${
            props.activeTab === 'document' ? ' ctl-bottom-nav__item--active' : ''
          }`}
          onClick={() => history.push(getProductPath(props.productId, productNavItems[3].id))}
          type="button"
        >
          <IonIcon icon={productNavItems[3].icon} />
          <span>{productNavItems[3].label}</span>
        </button>
      </nav>
    );
  }

  const pathname = location.pathname;
  const isServicesActive = pathname === '/services' || pathname.startsWith('/services/');

  return (
    <nav aria-label="Customer navigation" className="ctl-bottom-nav">
      <button
        aria-current={pathname === '/home' ? 'page' : undefined}
        className={`ctl-bottom-nav__item${
          pathname === '/home' ? ' ctl-bottom-nav__item--active' : ''
        }`}
        onClick={() => history.push('/home')}
        type="button"
      >
        <IonIcon icon={homeOutline} />
        <span>Home</span>
      </button>

      <button
        aria-current={isServicesActive ? 'page' : undefined}
        className={`ctl-bottom-nav__item${
          isServicesActive ? ' ctl-bottom-nav__item--active' : ''
        }`}
        onClick={() => history.push('/services')}
        type="button"
      >
        <IonIcon icon={gridOutline} />
        <span>Services</span>
      </button>

      <button
        className="ctl-bottom-nav__quote"
        onClick={() => openProtectedPath('/quote')}
        type="button"
      >
        <span className="ctl-bottom-nav__quote-icon">
          <IonIcon icon={documentTextOutline} />
        </span>
        <span>QUOTE</span>
      </button>

      <button
        aria-current={pathname === '/quotes' || pathname === '/status' ? 'page' : undefined}
        className={`ctl-bottom-nav__item${
          pathname === '/quotes' || pathname === '/status'
            ? ' ctl-bottom-nav__item--active'
            : ''
        }`}
        onClick={() => openProtectedPath('/quotes')}
        type="button"
      >
        <IonIcon icon={listOutline} />
        <span>Track</span>
      </button>

      <button
        aria-current={pathname === '/contact' ? 'page' : undefined}
        className={`ctl-bottom-nav__item${
          pathname === '/contact' ? ' ctl-bottom-nav__item--active' : ''
        }`}
        onClick={() => history.push('/contact')}
        type="button"
      >
        <IonIcon icon={callOutline} />
        <span>Contact</span>
      </button>
    </nav>
  );
};

export default BottomNav;
