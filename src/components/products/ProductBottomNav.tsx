import type { FC } from 'react';
import { IonIcon } from '@ionic/react';
import {
  documentTextOutline,
  folderOpenOutline,
  informationCircleOutline,
  layersOutline,
  listOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import { getProductPath, type ProductTab } from '../../data/servicesProducts';
import './ProductBottomNav.css';

interface ProductBottomNavProps {
  activeTab: ProductTab;
  productId: string;
}

const navItems = [
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

const ProductBottomNav: FC<ProductBottomNavProps> = ({ activeTab, productId }) => {
  const history = useHistory();

  return (
    <nav aria-label="Product navigation" className="ctl-product-nav">
      <button
        className={`ctl-product-nav__item${activeTab === 'overview' ? ' ctl-product-nav__item--active' : ''}`}
        onClick={() => history.push(getProductPath(productId, navItems[0].id))}
        type="button"
      >
        <IonIcon icon={navItems[0].icon} />
        <span>{navItems[0].label}</span>
      </button>

      <button
        className={`ctl-product-nav__item${activeTab === 'details' ? ' ctl-product-nav__item--active' : ''}`}
        onClick={() => history.push(getProductPath(productId, navItems[1].id))}
        type="button"
      >
        <IonIcon icon={navItems[1].icon} />
        <span>{navItems[1].label}</span>
      </button>

      <button
        className="ctl-product-nav__quote"
        onClick={() => history.push('/contact')}
        type="button"
      >
        <span className="ctl-product-nav__quote-icon">
          <IonIcon icon={documentTextOutline} />
        </span>
        <span>QUOTE</span>
      </button>

      <button
        className={`ctl-product-nav__item${activeTab === 'application' ? ' ctl-product-nav__item--active' : ''}`}
        onClick={() => history.push(getProductPath(productId, navItems[2].id))}
        type="button"
      >
        <IonIcon icon={navItems[2].icon} />
        <span>{navItems[2].label}</span>
      </button>

      <button
        className={`ctl-product-nav__item${activeTab === 'document' ? ' ctl-product-nav__item--active' : ''}`}
        onClick={() => history.push(getProductPath(productId, navItems[3].id))}
        type="button"
      >
        <IonIcon icon={navItems[3].icon} />
        <span>{navItems[3].label}</span>
      </button>
    </nav>
  );
};

export default ProductBottomNav;
