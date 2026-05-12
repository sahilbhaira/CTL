import { IonIcon } from '@ionic/react';

interface AdminStatCardProps {
  active?: boolean;
  icon: string;
  label: string;
  onClick?: () => void;
  tone?: 'accepted' | 'negotiating' | 'pending' | 'primary' | 'sent';
  value: number | string;
  wide?: boolean;
}

const AdminStatCard: React.FC<AdminStatCardProps> = ({
  active,
  icon,
  label,
  onClick,
  tone = 'primary',
  value,
  wide
}) => {
  const content = (
    <>
      <span>
        <strong>{label}</strong>
        <em>{value}</em>
      </span>
      <span className="ctl-admin-stat__icon">
        <IonIcon icon={icon} />
      </span>
    </>
  );

  const className = `ctl-admin-stat ctl-admin-stat--${tone}${
    active ? ' ctl-admin-stat--active' : ''
  }${wide ? ' ctl-admin-stat--wide' : ''}`;

  if (onClick) {
    return (
      <button className={className} onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return <article className={className}>{content}</article>;
};

export default AdminStatCard;
