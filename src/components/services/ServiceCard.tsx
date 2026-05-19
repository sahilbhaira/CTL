import type { CSSProperties, FC } from 'react';
import { IonIcon } from '@ionic/react';
import './ServiceCard.css';

interface ServiceCardProps {
  title: string;
  icon: string;
  image: string;
  onClick?: () => void;
  serviceId: string;
}

const ServiceCard: FC<ServiceCardProps> = ({ title, icon, image, onClick, serviceId }) => (
  <button className="ctl-service-card" onClick={onClick} type="button">
    <span
      aria-hidden="true"
      className={`ctl-service-card__media ctl-service-card__media--${serviceId}`}
      style={{ '--service-card-image': `url(${image})` } as CSSProperties}
    >
      <span className="ctl-service-card__media-shade" />
      {/* <span className="ctl-service-card__media-badge">
        <IonIcon icon={icon} />
      </span> */}
    </span>
    <span className="ctl-service-card__body">
      <span className="ctl-service-card__icon">
        <IonIcon icon={icon} />
      </span>
      <span className="ctl-service-card__title">{title}</span>
    </span>
  </button>
);

export default ServiceCard;
