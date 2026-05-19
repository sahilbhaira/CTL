import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { Share } from '@capacitor/share';
import {
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
import { useEffect } from 'react';
import { useHistory, useLocation, useParams } from 'react-router';
import BottomNav from '../../components/navigation/BottomNav';
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

const isFilledString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isFilledKeyValue = (item: unknown): item is ProductKeyValue =>
  Boolean(
    item &&
      typeof item === 'object' &&
      isFilledString((item as Partial<ProductKeyValue>).label) &&
      isFilledString((item as Partial<ProductKeyValue>).value)
  );

const hasDocumentDownload = (url: string | null | undefined) => {
  if (!isFilledString(url)) {
    return false;
  }

  return /\.(pdf|doc|docx)$/i.test(url.split('?')[0]);
};

const getAbsoluteDocumentUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return new URL(url, window.location.href).href;
};

const getDocumentFileName = (url: string | null | undefined, label: string) => {
  if (isFilledString(url)) {
    const [path] = url.split('?');
    const fileName = path.split('/').filter(Boolean).pop();

    if (fileName) {
      return fileName;
    }
  }

  return `${label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'product-document'}.pdf`;
};

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
  const highlights = product.tabs.overview.advantages.filter(isFilledString).slice(0, 3);

  if (!highlights.length) {
    return null;
  }

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

const OverviewTab = ({ product }: { product: Product }) => {
  const usage = product.tabs.overview.usage.filter(isFilledString);
  const advantages = product.tabs.overview.advantages.filter(isFilledString);
  const hasPackaging = isFilledString(product.tabs.overview.packaging);
  const hasColour = isFilledString(product.tabs.overview.colour);

  return (
    <>
      {usage.length ? (
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
            {usage.map((area) => (
              <div className="ctl-chip" key={area}>
                <IonIcon icon={checkmarkCircleOutline} />
                {area}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {advantages.length ? (
        <section className="ctl-product-section">
          <h2 className="ctl-product-section-title">
            <span>
              <IonIcon icon={ribbonOutline} />
            </span>
            Key Advantages
          </h2>
          <div className="ctl-stack">
            {advantages.map((advantage) => (
              <div className="ctl-advantage-card" key={advantage}>
                <div className="ctl-advantage-card__icon">
                  <IonIcon icon={checkmarkCircleOutline} />
                </div>
                <span>{advantage}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hasPackaging || hasColour ? (
        <section className="ctl-product-section">
          <div className="ctl-product-grid">
            {hasPackaging ? (
              <div className="ctl-stat-card">
                <IonIcon icon={cubeOutline} />
                <h3>Packaging</h3>
                <p>{product.tabs.overview.packaging}</p>
              </div>
            ) : null}
            {hasColour ? (
              <div className="ctl-stat-card">
                <div className="ctl-color-dot" />
                <h3>Color</h3>
                <p>{product.tabs.overview.colour}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
};

const DetailsTab = ({ keyValues }: { keyValues: ProductKeyValue[] }) => {
  const filledKeyValues = keyValues.filter(isFilledKeyValue);
  const approvalItems = filledKeyValues.filter((item) =>
    item.label.toLowerCase().includes('approval')
  );
  const productInfo = filledKeyValues.filter(
    (item) => !item.label.toLowerCase().includes('approval')
  );

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

      {productInfo.length > 0 ? (
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
      ) : null}
    </>
  );
};

const ApplicationTab = ({ product }: { product: Product }) => {
  const steps = product.tabs.application.steps.filter(
    (step): step is ProductApplicationStep =>
      Boolean(step && isFilledString(step.title) && isFilledString(step.description))
  );
  const consumption = isFilledKeyValue(product.tabs.application.consumption)
    ? product.tabs.application.consumption
    : null;
  const notes = isFilledString(product.tabs.application.notes)
    ? product.tabs.application.notes
    : null;

  return (
    <>
      {steps.length ? (
        <section className="ctl-product-section">
          <h2 className="ctl-product-section-title">
            <span>
              <IonIcon icon={hammerOutline} />
            </span>
            Application Information
          </h2>
          <div className="ctl-stack">
            {steps.map((step) => (
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
      ) : null}

      {consumption || notes ? (
        <section className="ctl-product-section">
          <h2 className="ctl-product-section-title">
            <span>
              <IonIcon icon={scaleOutline} />
            </span>
            Consumption
          </h2>
          {consumption ? (
            <div className="ctl-info-card">
              <h3>{consumption.label}</h3>
              <p>{consumption.value}</p>
            </div>
          ) : null}
          {notes ? (
            <div className="ctl-info-card">
              <h3>Notes</h3>
              <p>{notes}</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
};

const DocumentTab = ({ product }: { product: Product }) => {
  const files = product.tabs.documents.files.filter(
    (file) =>
      isFilledString(file.label) || isFilledString(file.type) || isFilledString(file.url)
  );

  if (!files.length) {
    return null;
  }

  return (
    <section className="ctl-product-section">
      <h2 className="ctl-product-section-title">
        <span>
          <IonIcon icon={documentTextOutline} />
        </span>
        Product Data Sheet
      </h2>

      <div className="ctl-stack">
        {files.map((file) => (
          <div className="ctl-document-card" key={`${file.label}-${file.url ?? 'disabled'}`}>
            <div className="ctl-document-card__main">
              <div className="ctl-document-card__icon">
                <IonIcon icon={documentTextOutline} />
              </div>
              <div>
                <h2>{isFilledString(file.label) ? file.label : 'Product document'}</h2>
                <span>{isFilledString(file.type) ? file.type : 'Document unavailable'}</span>
              </div>
            </div>
            {hasDocumentDownload(file.url) ? (
              <a
                aria-label={`Download ${file.label}`}
                className="ctl-document-download"
                download={getDocumentFileName(file.url, file.label)}
                href={file.url ?? undefined}
              >
                <IonIcon icon={downloadOutline} />
              </a>
            ) : (
              <button
                aria-label={`${file.label || 'Document'} download unavailable`}
                className="ctl-document-download ctl-document-download--disabled"
                disabled
                type="button"
              >
                <IonIcon icon={downloadOutline} />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

const ProductDetails: React.FC = () => {
  const history = useHistory();
  const { pathname } = useLocation();
  const { productId } = useParams<ProductRouteParams>();
  const product = getProductById(productId) ?? getProductById('sikacim');
  const activeTab = getProductTab(pathname);
  const servicePath = product ? getServicePath(product.serviceId) : '/services';

  useEffect(() => {
    if (!product) {
      return undefined;
    }

    const handleHardwareBack = (event: Event) => {
      const backEvent = event as CustomEvent<{
        register: (priority: number, handler: () => void) => void;
      }>;

      backEvent.detail?.register(10, () => {
        history.replace(servicePath);
      });
    };

    document.addEventListener('ionBackButton', handleHardwareBack);

    return () => {
      document.removeEventListener('ionBackButton', handleHardwareBack);
    };
  }, [history, product, servicePath]);

  if (!product) {
    return null;
  }

  const service = getServiceById(product.serviceId);
  const productTitle = isFilledString(product.name) ? product.name : 'Product';
  const documentFiles = product.tabs.documents.files.filter(
    (file) =>
      isFilledString(file.label) || isFilledString(file.type) || isFilledString(file.url)
  );
  const primaryDownload = documentFiles.find((file) => hasDocumentDownload(file.url));

  const handleShareProduct = async () => {
    if (!primaryDownload?.url) {
      return;
    }

    const url = getAbsoluteDocumentUrl(primaryDownload.url);
    const title = `${productTitle} Product Data Sheet`;

    try {
      await Share.share({
        dialogTitle: 'Share product document',
        text: title,
        title,
        url
      });
    } catch {
      if (navigator.share) {
        try {
          await navigator.share({
            text: title,
            title,
            url
          });
        } catch {
          // User cancelled or sharing is unavailable in this browser context.
        }
      }
    }
  };

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
        onBack={() => history.replace(servicePath)}
        onShare={handleShareProduct}
        shareDisabled={!primaryDownload}
        title={productTitle}
        variant="brand"
      />
      <IonContent className="ctl-catalog-content" fullscreen>
        <main className="ctl-product">
          {activeTab === "overview" ? (
          <>
          <section className="ctl-product-title">
            <div className="ctl-product-title__top">
              <h1>{productTitle}</h1>
              {primaryDownload ? (
                <a
                  aria-label="Download product data sheet"
                  className="ctl-product-download"
                  download={getDocumentFileName(primaryDownload.url, primaryDownload.label)}
                  href={primaryDownload.url ?? undefined}
                >
                  <IonIcon icon={downloadOutline} />
                </a>
              ) : (
                <button
                  aria-label="Product data sheet download unavailable"
                  className="ctl-product-download ctl-product-download--disabled"
                  disabled
                  type="button"
                >
                  <IonIcon icon={downloadOutline} />
                </button>
              )}
            </div>
            {isFilledString(product.tagline) ? <h2>{product.tagline}</h2> : null}
            {isFilledString(product.tabs.overview.text) ? (
              <p>{product.tabs.overview.text}</p>
            ) : null}
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
          </>
          ):(
            <section className="ctl-product-title">
              <div className="ctl-product-title__top">
                <h1>{productTitle}</h1>
                {primaryDownload ? (
                  <a
                    aria-label="Download product data sheet"
                    className="ctl-product-download"
                    download={getDocumentFileName(primaryDownload.url, primaryDownload.label)}
                    href={primaryDownload.url ?? undefined}
                  >
                    <IonIcon icon={downloadOutline} />
                  </a>
                ) : (
                  <button
                    aria-label="Product data sheet download unavailable"
                    className="ctl-product-download ctl-product-download--disabled"
                    disabled
                    type="button"
                  >
                    <IonIcon icon={downloadOutline} />
                  </button>
                )}
              </div>
            </section>
          )}
          {renderTab()}
        </main>
      </IonContent>
      <BottomNav activeTab={activeTab} productId={product.id} variant="product" />
    </IonPage>
  );
};

export default ProductDetails;
