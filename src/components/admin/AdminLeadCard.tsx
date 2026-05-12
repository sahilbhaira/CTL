import { IonIcon } from '@ionic/react';
import {
  arrowForwardOutline,
  cubeOutline,
  documentTextOutline,
  mailOutline,
  phonePortraitOutline
} from 'ionicons/icons';
import {
  formatIndianCurrency,
  formatQuotationReference
} from '../../lib/quotation';
import type { AdminQuotationRequest } from '../../services/api/edgeFunctionsApi';
import AdminStatusBadge from './AdminStatusBadge';

interface AdminLeadCardProps {
  actionLabel?: string;
  compact?: boolean;
  onAction?: (quote: AdminQuotationRequest) => void;
  quote: AdminQuotationRequest;
  showAmount?: boolean;
}

const AdminLeadCard: React.FC<AdminLeadCardProps> = ({
  actionLabel = 'VIEW DETAILS',
  compact,
  onAction,
  quote,
  showAmount
}) => {
  const firstProduct = quote.products[0];
  const productCount = quote.products.length;

  return (
    <article className={`ctl-admin-lead-card${compact ? ' ctl-admin-lead-card--compact' : ''}`}>
      <div className="ctl-admin-lead-card__top">
        <div>
          <h2>{quote.customer.name}</h2>
          <span>
            <IonIcon icon={documentTextOutline} />
            {formatQuotationReference(quote.id)}
          </span>
        </div>
        <AdminStatusBadge status={quote.status} />
      </div>

      <div className="ctl-admin-lead-card__body">
        {showAmount ? (
          <div className="ctl-admin-lead-card__amount">
            <span>Final Amount</span>
            <strong>{formatIndianCurrency(quote.quoteAmount)}</strong>
          </div>
        ) : null}

        <div className="ctl-admin-lead-meta">
          <IonIcon icon={cubeOutline} />
          <span>Products:</span>
          <strong>
            {firstProduct?.productName ?? 'No products'}
            {productCount > 1 ? ` +${productCount - 1}` : ''}
          </strong>
        </div>

        {firstProduct ? (
          <div className="ctl-admin-lead-meta">
            <span>Quantity:</span>
            <strong>{firstProduct.quantity}</strong>
          </div>
        ) : null}

        <div className="ctl-admin-lead-contact">
          <span>
            <IonIcon icon={phonePortraitOutline} />
            {quote.customer.phone}
          </span>
          <span>
            <IonIcon icon={mailOutline} />
            {quote.customer.email}
          </span>
        </div>
      </div>

      {onAction ? (
        <button
          className="ctl-admin-card-action"
          onClick={() => onAction(quote)}
          type="button"
        >
          {actionLabel}
          <IonIcon icon={arrowForwardOutline} />
        </button>
      ) : null}
    </article>
  );
};

export default AdminLeadCard;

