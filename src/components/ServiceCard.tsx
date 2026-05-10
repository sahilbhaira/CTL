import type { FC } from 'react';
import { IonIcon } from '@ionic/react';
import './ServiceCard.css';

interface ServiceCardProps {
  title: string;
  icon: string;
  image: string;
  onClick?: () => void;
}

const ServiceCard: FC<ServiceCardProps> = ({ title, icon, image, onClick }) => (
  <button className="ctl-service-card" onClick={onClick} type="button">
    <span
      aria-hidden="true"
      className="ctl-service-card__image"
      style={{ backgroundImage: `url(${image})` }}
    />
    <span className="ctl-service-card__body">
      <span className="ctl-service-card__icon">
        <IonIcon icon={icon} />
      </span>
      <span className="ctl-service-card__title">{title}</span>
    </span>
  </button>
);

export default ServiceCard;
