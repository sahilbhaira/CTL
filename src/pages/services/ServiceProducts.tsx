import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  arrowBackOutline,
  documentTextOutline,
  informationCircleOutline,
  searchOutline
} from 'ionicons/icons';
import { useHistory, useParams } from 'react-router';
import AppHeader from '../../components/header/AppHeader';
import {
  getProductPath,
  getProductsForService,
  getServiceById,
  getServiceIcon
} from '../../data/servicesProducts';
import './services.css';

interface ServiceRouteParams {
  serviceId: string;
}

const ServiceProducts: React.FC = () => {
  const history = useHistory();
  const { serviceId } = useParams<ServiceRouteParams>();
  const service = getServiceById(serviceId) ?? getServiceById('concrete-admixture');
  const products = getProductsForService(service?.id);

  if (!service) {
    return null;
  }

  return (
    <IonPage>
      <AppHeader title="Chandigarh Trade Link" variant="brand" />
      <IonContent className="ctl-catalog-content" fullscreen>
        <main className="ctl-catalog">
          <section className="ctl-catalog-heading">
            <div className="ctl-catalog-title-row">
              <button
                aria-label="Back to services"
                className="ctl-catalog-back"
                onClick={() => history.push('/services')}
                type="button"
              >
                <IonIcon icon={arrowBackOutline} />
              </button>
              <h1>{service.name}</h1>
            </div>
            <div className="ctl-catalog-search">
              <IonIcon icon={searchOutline} />
              <span>Search product...</span>
            </div>
          </section>

          <section className="ctl-card-list" aria-label={`${service.name} products`}>
            {products.map((product) => (
              <article className="ctl-product-list-card" key={product.id}>
                <div className="ctl-product-list-card__main">
                  <div className="ctl-product-list-card__icon">
                    <IonIcon icon={getServiceIcon(product.serviceId)} />
                  </div>
                  <div className="ctl-product-list-card__content">
                    <h2>{product.name}</h2>
                    <p>{product.tagline}</p>
                  </div>
                </div>

                <div className="ctl-product-actions">
                  <button
                    className="ctl-product-action"
                    onClick={() => history.push(getProductPath(product.id))}
                    type="button"
                  >
                    <IonIcon icon={informationCircleOutline} />
                    VIEW DETAILS
                  </button>
                  <button
                    className="ctl-product-action ctl-product-action--quote"
                    onClick={() => history.push('/contact')}
                    type="button"
                  >
                    <IonIcon icon={documentTextOutline} />
                    GET QUOTE
                  </button>
                </div>
              </article>
            ))}

            {!products.length && (
              <article className="ctl-product-list-card">
                <div className="ctl-product-list-card__content">
                  <h2>No products found</h2>
                  <p>This service has no linked products yet.</p>
                </div>
              </article>
            )}
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default ServiceProducts;
