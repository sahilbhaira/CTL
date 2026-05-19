import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  addOutline,
  checkmarkOutline,
  informationCircleOutline,
  searchOutline,
  trashOutline
} from 'ionicons/icons';
import { type KeyboardEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import AppHeader from '../../components/header/AppHeader';
import {
  getProductPath,
  getProductQuantityUnit,
  getProductsForService,
  getServiceById,
  getServiceIcon
} from '../../data/servicesProducts';
import { isPositiveQuantity, sanitizeQuantityInput } from '../../lib/quantity';
import { getUserDisplayName } from '../../lib/userProfile';
import { useAuthStore } from '../../store/authStore';
import { useQuoteDraftStore } from '../../store/quoteDraftStore';
import './services.css';
import { useQuoteAccessStore } from '../../store/quoteAccessStore';

interface ServiceRouteParams {
  serviceId: string;
}

const ServiceProducts: React.FC = () => {
  const history = useHistory();
  const { serviceId } = useParams<ServiceRouteParams>();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? null;
  const addProductToDraft = useQuoteDraftStore((state) => state.addProductToDraft);
  const quoteDraft = useQuoteDraftStore((state) => {
    if (!state.values) {
      return null;
    }

    if (state.ownerUserId && state.ownerUserId !== userId) {
      return null;
    }

    return state.values;
  });
  const removeProductFromDraft = useQuoteDraftStore(
    (state) => state.removeProductFromDraft
  );
  const updateProductQuantity = useQuoteDraftStore(
    (state) => state.updateProductQuantity
  );
  const service = getServiceById(serviceId) ?? getServiceById('concrete-admixture');
  const products = getProductsForService(service?.id);
  const [confirmingProductIds, setConfirmingProductIds] = useState<string[]>([]);
  const [quantityFocusProductId, setQuantityFocusProductId] = useState<string | null>(null);
  const confirmationTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const quantityInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const openQuoteLoginPrompt = useQuoteAccessStore((state) => state.openLoginPrompt);
  const selectedQuoteProductIds = useMemo(
    () =>
      new Set(
        quoteDraft?.serviceBlocks.flatMap((block) => block.productIds) ?? []
      ),
    [quoteDraft?.serviceBlocks]
  );
  const quoteProductQuantities = useMemo(() => {
    const quantities = new Map<string, string>();

    quoteDraft?.serviceBlocks.forEach((block) => {
      block.productIds.forEach((productId) => {
        quantities.set(productId, block.productQuantities[productId] ?? '');
      });
    });

    return quantities;
  }, [quoteDraft?.serviceBlocks]);

  useEffect(
    () => () => {
      Object.values(confirmationTimersRef.current).forEach((timerId) =>
        clearTimeout(timerId)
      );
    },
    []
  );

  useEffect(() => {
    if (!quantityFocusProductId || !selectedQuoteProductIds.has(quantityFocusProductId)) {
      return;
    }

    const input = quantityInputRefs.current[quantityFocusProductId];

    window.requestAnimationFrame(() => {
      input?.focus();
      input?.select();
    });
    setQuantityFocusProductId(null);
  }, [quantityFocusProductId, selectedQuoteProductIds]);

  if (!service) {
    return null;
  }

  const showAddedConfirmation = (productId: string) => {
    setConfirmingProductIds((productIds) =>
      productIds.includes(productId) ? productIds : [...productIds, productId]
    );

    clearTimeout(confirmationTimersRef.current[productId]);
    confirmationTimersRef.current[productId] = setTimeout(() => {
      setConfirmingProductIds((productIds) =>
        productIds.filter((selectedProductId) => selectedProductId !== productId)
      );
      delete confirmationTimersRef.current[productId];
    }, 900);
  };

  const addProductForQuotation = (productId: string) => {
    addProductToDraft({
      customer: {
        email: user?.email ?? '',
        name: user ? getUserDisplayName(user) : ''
      },
      ownerUserId: user?.id ?? null,
      productId,
      serviceId: service.id
    });
    setQuantityFocusProductId(productId);
    showAddedConfirmation(productId);
  };

  const removeProductForQuotation = (productId: string) => {
    clearTimeout(confirmationTimersRef.current[productId]);
    delete confirmationTimersRef.current[productId];
    setConfirmingProductIds((productIds) =>
      productIds.filter((selectedProductId) => selectedProductId !== productId)
    );
    removeProductFromDraft(productId);
  };

  const handleQuoteProductToggle = (productId: string) => {
    if (!isAuthReady) {
      return;
    }

    if (!user) {
      openQuoteLoginPrompt('/quote');
      return;
    }

    if (selectedQuoteProductIds.has(productId)) {
      removeProductForQuotation(productId);
      return;
    }

    addProductForQuotation(productId);
  };

  const openProductDetails = (productId: string) => {
    history.push(getProductPath(productId));
  };

  const handleProductCardKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    productId: string
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openProductDetails(productId);
    }
  };

  const stopCardClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const stopCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <IonPage>
      <AppHeader
        brandLeading="back"
        onBack={() => history.replace('/services')}
        title={service.name}
        variant="brand"
      />
      <IonContent className="ctl-catalog-content" fullscreen>
        <main className="ctl-catalog">
          <section className="ctl-catalog-heading">
            <div className="ctl-catalog-search">
              <IonIcon icon={searchOutline} />
              <span>Search product...</span>
            </div>
          </section>

          <section className="ctl-card-list" aria-label={`${service.name} products`}>
            {products.map((product) => {
              const isSelectedForQuote = selectedQuoteProductIds.has(product.id);
              const isConfirmingAdd = confirmingProductIds.includes(product.id);
              const productActionLabel = isConfirmingAdd
                ? `${product.name} added to quotation`
                : isSelectedForQuote
                  ? `Remove ${product.name} from quotation`
                  : `Add ${product.name} to quotation`;
              const productActionIcon = isConfirmingAdd
                ? checkmarkOutline
                : isSelectedForQuote
                  ? trashOutline
                  : addOutline;
              const quantity = quoteProductQuantities.get(product.id) ?? '';

              return (
                <article
                  className="ctl-product-list-card"
                  key={product.id}
                  onClick={() => openProductDetails(product.id)}
                  onKeyDown={(event) => handleProductCardKeyDown(event, product.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="ctl-product-list-card__main">
                    <div className="ctl-product-list-card__icon">
                      <IonIcon icon={getServiceIcon(product.serviceId)} />
                    </div>
                    <div className="ctl-product-list-card__content">
                      <h2>{product.name}</h2>
                      <p>{product.tagline}</p>
                    </div>
                    <button
                      aria-label={productActionLabel}
                      className={`ctl-product-add-button${
                        isConfirmingAdd
                          ? ' ctl-product-add-button--confirming'
                          : isSelectedForQuote
                            ? ' ctl-product-add-button--remove'
                            : ''
                      }`}
                      disabled={isConfirmingAdd}
                      onClick={(event) => {
                        stopCardClick(event);
                        handleQuoteProductToggle(product.id);
                      }}
                      onKeyDown={stopCardKeyDown}
                      type="button"
                    >
                      <IonIcon icon={productActionIcon} />
                      {isConfirmingAdd ? (
                        <span className="ctl-product-added-tooltip">
                          Added to request list
                        </span>
                      ) : null}
                    </button>
                  </div>

                  <div className="ctl-product-actions">
                    <button
                      className="ctl-product-action"
                      onClick={(event) => {
                        stopCardClick(event);
                        openProductDetails(product.id);
                      }}
                      type="button"
                    >
                      <IonIcon icon={informationCircleOutline} />
                      VIEW DETAILS
                    </button>
                    <label
                      className={`ctl-product-quantity-control${
                        isSelectedForQuote ? '' : ' ctl-product-quantity-control--disabled'
                      }`}
                      onClick={stopCardClick}
                      onKeyDown={stopCardKeyDown}
                    >
                      <span>Qty</span>
                      <input
                        aria-label={`${product.name} quote quantity`}
                        disabled={!isSelectedForQuote}
                        inputMode="decimal"
                        onBlur={(event) => {
                          if (
                            event.target.value.trim() &&
                            !isPositiveQuantity(event.target.value)
                          ) {
                            updateProductQuantity(product.id, '');
                          }
                        }}
                        onChange={(event) =>
                          updateProductQuantity(
                            product.id,
                            sanitizeQuantityInput(event.target.value)
                          )
                        }
                        pattern="[0-9]*[.]?[0-9]*"
                        placeholder="0"
                        ref={(element) => {
                          quantityInputRefs.current[product.id] = element;
                        }}
                        value={quantity}
                      />
                      <em>{getProductQuantityUnit(product)}</em>
                    </label>
                  </div>
                </article>
              );
            })}

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
