import { IonIcon } from '@ionic/react';
import { layersOutline } from 'ionicons/icons';
import type { ChangeEvent, FC } from 'react';
import type { Product } from '../../data/servicesProducts';

interface QuoteQuantityFieldsProps {
  getError: (productId: string) => string | undefined;
  isTouched: (productId: string) => boolean;
  onBlur: (productId: string) => void;
  onChange: (productId: string, value: string) => void;
  products: Product[];
  quantities: Record<string, string>;
}

const QuoteQuantityFields: FC<QuoteQuantityFieldsProps> = ({
  getError,
  isTouched,
  onBlur,
  onChange,
  products,
  quantities
}) => (
  <div className="ctl-quote-field">
    <span>Quantity</span>
    <div className="ctl-quote-quantity-list">
      {products.length ? (
        products.map((product) => {
          const error = getError(product.id);
          const touched = isTouched(product.id);

          return (
            <label className="ctl-quote-product-quantity" key={product.id}>
              <span>{product.name}</span>
              <div className="ctl-quote-control">
                <IonIcon icon={layersOutline} />
                <input
                  name={`productQuantities.${product.id}`}
                  onBlur={() => onBlur(product.id)}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onChange(product.id, event.target.value)
                  }
                  placeholder="E.g. 50 kg, 100 liters"
                  value={quantities[product.id] ?? ''}
                />
              </div>
              {touched && error ? <small>{error}</small> : null}
            </label>
          );
        })
      ) : (
        <div className="ctl-quote-empty-products">Select products to add quantities.</div>
      )}
    </div>
  </div>
);

export default QuoteQuantityFields;
