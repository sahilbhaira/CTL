import { IonIcon, IonSelect, IonSelectOption } from '@ionic/react';
import {
  addOutline,
  chevronDownOutline,
  chevronUpOutline,
  trashOutline
} from 'ionicons/icons';
import { useRef } from 'react';
import {
  getProductQuantityUnit,
  type Product,
  type ServiceCategory
} from '../../data/servicesProducts';

export interface QuoteServiceBlockValue {
  id: string;
  productIds: string[];
  productQuantities: Record<string, string>;
  serviceId: string;
}

interface QuoteServiceBlockProps {
  block: QuoteServiceBlockValue;
  canRemove: boolean;
  index: number;
  isQuantityTouched: (productId: string) => boolean;
  onProductBlur: (productId: string) => void;
  onProductChange: (productIds: string[]) => void;
  onProductRemove: (productId: string) => void;
  onProductQuantityChange: (productId: string, value: string) => void;
  onProductTouched: () => void;
  onRemove: () => void;
  onServiceChange: (serviceId: string) => void;
  onServiceTouched: () => void;
  productError?: string;
  productOptions: Product[];
  quantityErrors: Record<string, string>;
  selectedProducts: Product[];
  selectedService?: ServiceCategory;
  serviceError?: string;
  serviceOptions: ServiceCategory[];
  serviceTouched?: boolean;
  productTouched?: boolean;
}

const normalizeProductSelection = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  return value ? [String(value)] : [];
};

const QuoteServiceBlock: React.FC<QuoteServiceBlockProps> = ({
  block,
  canRemove,
  index,
  isQuantityTouched,
  onProductBlur,
  onProductChange,
  onProductRemove,
  onProductQuantityChange,
  onProductTouched,
  onRemove,
  onServiceChange,
  onServiceTouched,
  productError,
  productOptions,
  productTouched,
  quantityErrors,
  selectedProducts,
  selectedService,
  serviceError,
  serviceOptions,
  serviceTouched
}) => {
  const productSelectRef = useRef<HTMLIonSelectElement | null>(null);

  const openProductSelector = () => {
    onProductTouched();
    void productSelectRef.current?.open();
  };

  return (
    <article className="ctl-quote-service-card">
      <div className="ctl-quote-service-card__header">
        <h2>Service {index + 1}</h2>
        {canRemove ? (
          <button className="ctl-quote-remove-service" onClick={onRemove} type="button">
            <IonIcon icon={trashOutline} />
            Remove Service
          </button>
        ) : (
          <IonIcon className="ctl-quote-service-card__chevron" icon={chevronUpOutline} />
        )}
      </div>

      <label className="ctl-quote-field">
        <span>Select Service</span>
        <div className="ctl-quote-select ctl-quote-select--single">
          <IonSelect
            name={`serviceBlocks.${index}.serviceId`}
            onIonBlur={onServiceTouched}
            onIonChange={(event) => onServiceChange(String(event.detail.value ?? ''))}
            placeholder="Select Service"
            selectedText={selectedService?.name ?? 'Select Service'}
            value={block.serviceId}
          >
            {serviceOptions.map((service) => (
              <IonSelectOption key={service.id} value={service.id}>
                {service.name}
              </IonSelectOption>
            ))}
          </IonSelect>
          <IonIcon icon={chevronDownOutline} />
        </div>
        {serviceTouched && serviceError ? <small>{serviceError}</small> : null}
      </label>

      <div className="ctl-quote-field">
        <span>Products & Quantity</span>
        <div className="ctl-quote-product-box">
          <div className="ctl-quote-product-select-row">
            <IonSelect
              disabled={!block.serviceId}
              multiple
              name={`serviceBlocks.${index}.productIds`}
              onIonBlur={onProductTouched}
              onIonChange={(event) =>
                onProductChange(normalizeProductSelection(event.detail.value))
              }
              placeholder={block.serviceId ? 'Select Products' : 'Select service first'}
              ref={productSelectRef}
              selectedText="Select Products"
              value={block.productIds}
            >
              {productOptions.map((product) => (
                <IonSelectOption key={product.id} value={product.id}>
                  {product.name}
                </IonSelectOption>
              ))}
            </IonSelect>
            <IonIcon icon={chevronDownOutline} />
          </div>

          {selectedProducts.length ? (
            <div className="ctl-quote-selected-products">
              {selectedProducts.map((product) => {
                const quantityError = quantityErrors[product.id];
                const quantityTouched = isQuantityTouched(product.id);

                return (
                  <div className="ctl-quote-selected-product-row" key={product.id}>
                    <span>{product.name}</span>
                    <input
                      aria-label={`${product.name} quantity`}
                      inputMode="decimal"
                      name={`serviceBlocks.${index}.productQuantities.${product.id}`}
                      onBlur={() => onProductBlur(product.id)}
                      onChange={(event) =>
                        onProductQuantityChange(product.id, event.target.value)
                      }
                      pattern="[0-9]*[.]?[0-9]*"
                      placeholder="0"
                      value={block.productQuantities[product.id] ?? ''}
                    />
                    <em>{getProductQuantityUnit(product)}</em>
                    <button
                      aria-label={`Remove ${product.name}`}
                      className="ctl-quote-remove-product"
                      onClick={() => onProductRemove(product.id)}
                      type="button"
                    >
                      <IonIcon icon={trashOutline} />
                    </button>
                    {quantityTouched && quantityError ? <small>{quantityError}</small> : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        {productTouched && productError ? <small>{productError}</small> : null}

        <button
          className="ctl-quote-add-product"
          disabled={!block.serviceId}
          onClick={openProductSelector}
          type="button"
        >
          <IonIcon icon={addOutline} />
          Add Product
        </button>
      </div>
    </article>
  );
};

export default QuoteServiceBlock;
