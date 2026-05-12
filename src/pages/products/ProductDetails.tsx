import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  addOutline,
  checkmarkCircleOutline,
  cubeOutline,
  documentTextOutline,
  downloadOutline,
  hammerOutline,
  informationCircleOutline,
  layersOutline,
  locateOutline,
  pieChartOutline,
  ribbonOutline,
  scaleOutline,
  shieldCheckmarkOutline,
  trendingDownOutline
} from 'ionicons/icons';
import { useHistory, useLocation, useParams } from 'react-router';
import ProductBottomNav from '../../components/products/ProductBottomNav';
import AppHeader from '../../components/header/AppHeader';
import {
  getProductById,
  getServiceById,
  getServiceIcon,
  getServicePath,
  type Product,
  type ProductApplicationStep,
  type ProductKeyValue,
  type ProductTab
} from '../../data/servicesProducts';
import './product.css';

interface ProductRouteParams {
  productId: string;
}

const highlightIcons = [layersOutline, trendingDownOutline, pieChartOutline];

const getProductTab = (pathname: string): ProductTab => {
  if (pathname.endsWith('/details')) {
    return 'details';
  }

  if (pathname.endsWith('/application')) {
    return 'application';
  }

  if (pathname.endsWith('/document')) {
    return 'document';
  }

  return 'overview';
};


const ProductHighlights = ({ product }: { product: Product }) => {
  const highlights = product.tabs.overview.advantages.slice(0, 3);

  return (
    <section className="ctl-product-section">
      <div className="ctl-product-card ctl-highlight-list">
        {highlights.map((text, index) => (
          <div className="ctl-highlight-row" key={text}>
            <div className="ctl-highlight-row__icon">
              <IonIcon icon={highlightIcons[index] ?? layersOutline} />
            </div>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

const OverviewTab = ({ product }: { product: Product }) => (
  <>
    <section className="ctl-product-section">
      <h2 className="ctl-product-section-title">
        <span>
          <IonIcon icon={locateOutline} />
        </span>
        Usage Areas
      </h2>
      <p className="ctl-product-copy">
        Recommended for structural concrete & internal/external plaster, particularly for:
      </p>
      <div className="ctl-chip-row">
        {product.tabs.overview.usage.map((area) => (
          <div className="ctl-chip" key={area}>
            <IonIcon icon={checkmarkCircleOutline} />
            {area}
          </div>
        ))}
      </div>
    </section>

    <section className="ctl-product-section">
      <h2 className="ctl-product-section-title">
        <span>
          <IonIcon icon={ribbonOutline} />
        </span>
        Key Advantages
      </h2>
      <div className="ctl-stack">
        {product.tabs.overview.advantages.map((advantage) => (
          <div className="ctl-advantage-card" key={advantage}>
            <div className="ctl-advantage-card__icon">
              <IonIcon icon={addOutline} />
            </div>
            <span>{advantage}</span>
          </div>
        ))}
      </div>
    </section>

    <section className="ctl-product-section">
      <div className="ctl-product-grid">
        <div className="ctl-stat-card">
          <IonIcon icon={cubeOutline} />
          <h3>Packaging</h3>
          <p>{product.tabs.overview.packaging}</p>
        </div>
        <div className="ctl-stat-card">
          <div className="ctl-color-dot" />
          <h3>Color</h3>
          <p>{product.tabs.overview.colour}</p>
        </div>
      </div>
    </section>
  </>
);

const DetailsTab = ({ keyValues }: { keyValues: ProductKeyValue[] }) => {
  const approvalItems = keyValues.filter((item) => item.label.toLowerCase().includes('approval'));
  const productInfo = keyValues.filter((item) => !item.label.toLowerCase().includes('approval'));

  return (
    <>
      {approvalItems.length > 0 && (
        <section className="ctl-product-section">
          <h2 className="ctl-product-section-title">
            <span>
              <IonIcon icon={shieldCheckmarkOutline} />
            </span>
            Certifications & Approvals
          </h2>
          {approvalItems.map((item) => (
            <div className="ctl-info-card" key={item.label}>
              <h3>{item.label}</h3>
              <p>{item.value}</p>
            </div>
          ))}
        </section>
      )}

      <section className="ctl-product-section">
        <h2 className="ctl-product-section-title">
          <span>
            <IonIcon icon={informationCircleOutline} />
          </span>
          Product Information
        </h2>
        <div className="ctl-stack">
          {productInfo.map((item) => (
            <div className="ctl-info-card" key={item.label}>
              <h3>{item.label}</h3>
              <p>{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

const ApplicationTab = ({ product }: { product: Product }) => (
  <>
    <section className="ctl-product-section">
      <h2 className="ctl-product-section-title">
        <span>
          <IonIcon icon={hammerOutline} />
        </span>
        Application Information
      </h2>
      <div className="ctl-stack">
        {product.tabs.application.steps.map((step: ProductApplicationStep) => (
          <div className="ctl-step-card" key={`${step.step}-${step.title}`}>
            <div className="ctl-step-card__number">{step.step}</div>
            <div className="ctl-step-card__content">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="ctl-product-section">
      <h2 className="ctl-product-section-title">
        <span>
          <IonIcon icon={scaleOutline} />
        </span>
        Consumption
      </h2>
      <div className="ctl-info-card">
        <h3>{product.tabs.application.consumption.label}</h3>
        <p>{product.tabs.application.consumption.value}</p>
      </div>
      {product.tabs.application.notes && (
        <div className="ctl-info-card">
          <h3>Notes</h3>
          <p>{product.tabs.application.notes}</p>
        </div>
      )}
    </section>
  </>
);

const DocumentTab = ({ product }: { product: Product }) => (
  <section className="ctl-product-section">
    <h2 className="ctl-product-section-title">
      <span>
        <IonIcon icon={documentTextOutline} />
      </span>
      Product Data Sheet
    </h2>

    <div className="ctl-stack">
      {product.tabs.documents.files.map((file) => (
        <div className="ctl-document-card" key={file.url}>
          <div className="ctl-document-card__main">
            <div className="ctl-document-card__icon">
              <IonIcon icon={documentTextOutline} />
            </div>
            <div>
              <h2>{file.label}</h2>
              <span>{file.type}</span>
            </div>
          </div>
          <a aria-label={`Download ${file.label}`} className="ctl-document-download" href={file.url}>
            <IonIcon icon={downloadOutline} />
          </a>
        </div>
      ))}
    </div>
  </section>
);

const ProductDetails: React.FC = () => {
  const history = useHistory();
  const { pathname } = useLocation();
  const { productId } = useParams<ProductRouteParams>();
  const product = getProductById(productId) ?? getProductById('sikacim');
  const activeTab = getProductTab(pathname);

  if (!product) {
    return null;
  }

  const service = getServiceById(product.serviceId);

  const renderTab = () => {
    if (activeTab === 'details') {
      return <DetailsTab keyValues={product.tabs.details.keyValues} />;
    }

    if (activeTab === 'application') {
      return <ApplicationTab product={product} />;
    }

    if (activeTab === 'document') {
      return <DocumentTab product={product} />;
    }

    return <OverviewTab product={product} />;
  };

  return (
    <IonPage>
      <AppHeader
        brandLeading="back"
        brandTrailing="share"
        onBack={() => history.push(service ? getServicePath(service.id) : '/services')}
        title="Chandigarh Trade Link"
        variant="brand"
      />
      <IonContent className="ctl-catalog-content" fullscreen>
        <main className="ctl-product">
          <section className="ctl-product-title">
            <div className="ctl-product-title__top">
              <h1>{product.name}</h1>
              <button aria-label="Download product data sheet" className="ctl-product-download" type="button">
                <IonIcon icon={downloadOutline} />
              </button>
            </div>
            <h2>{product.tagline}</h2>
            <p>{product.tabs.overview.text}</p>
          </section>

          <section className="ctl-product-section">
            <div className="ctl-product-card ctl-highlight-list">
              <div className="ctl-highlight-row">
                <div className="ctl-highlight-row__icon">
                  <IonIcon icon={getServiceIcon(product.serviceId)} />
                </div>
                <span>{service?.name ?? 'Product'}</span>
              </div>
            </div>
          </section>

          <ProductHighlights product={product} />
          {renderTab()}
        </main>
      </IonContent>
      <ProductBottomNav activeTab={activeTab} productId={product.id} />
    </IonPage>
  );
};

export default ProductDetails;
