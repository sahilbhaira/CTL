import { IonIcon } from '@ionic/react';
import {
  checkmarkCircleOutline,
  chatbubbleEllipsesOutline,
  sendOutline,
  timeOutline
} from 'ionicons/icons';
import {
  formatQuotationStatus,
  getQuotationStatusGroup,
  type QuotationStatusGroup
} from '../../lib/quotation';

interface AdminStatusBadgeProps {
  status: string;
}

const statusIcons: Record<QuotationStatusGroup, string> = {
  accepted: checkmarkCircleOutline,
  negotiating: chatbubbleEllipsesOutline,
  pending: timeOutline,
  sent: sendOutline
};

const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({ status }) => {
  const group = getQuotationStatusGroup(status);

  return (
    <span className={`ctl-admin-status ctl-admin-status--${group}`}>
      <IonIcon icon={statusIcons[group]} />
      {formatQuotationStatus(status)}
    </span>
  );
};

export default AdminStatusBadge;

