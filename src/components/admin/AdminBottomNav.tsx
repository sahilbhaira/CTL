import { IonIcon } from '@ionic/react';
import {
  chatbubbleEllipsesOutline,
  checkmarkDoneCircleOutline,
  addOutline,
  peopleOutline,
  speedometerOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';

export type AdminTab = 'Accepted' | 'Dashboard' | 'Leads' | 'Negotiation';

interface AdminBottomNavProps {
  activeTab: AdminTab;
}

interface AdminNavItem {
  icon: string;
  label: AdminTab;
  path: string;
}

const adminNavItems: AdminNavItem[] = [
  { icon: speedometerOutline, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: peopleOutline, label: 'Leads', path: '/admin/leads' },
  { icon: chatbubbleEllipsesOutline, label: 'Negotiation', path: '/admin/negotiations' },
  { icon: checkmarkDoneCircleOutline, label: 'Accepted', path: '/admin/accepted' }
];

const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeTab }) => {
  const history = useHistory();

  return (
    <nav className="ctl-admin-bottom-nav" aria-label="Admin navigation">
      {adminNavItems.slice(0, 2).map((item) => {
        const isActive = activeTab === item.label;

        return (
          <button
            className={`ctl-admin-bottom-nav__item${
              isActive ? ' ctl-admin-bottom-nav__item--active' : ''
            }`}
            key={item.label}
            onClick={() => history.push(item.path)}
            type="button"
          >
            {isActive ? <span className="ctl-admin-bottom-nav__indicator" /> : null}
            <IonIcon icon={item.icon} />
            <span>{item.label}</span>
          </button>
        );
      })}

      <button
        className="ctl-admin-bottom-nav__quote"
        onClick={() => history.push('/admin/quote-preview')}
        type="button"
      >
        <span>
          <IonIcon icon={addOutline} />
        </span>
        <strong>QUOTE</strong>
      </button>

      {adminNavItems.slice(2).map((item) => {
        const isActive = activeTab === item.label;

        return (
          <button
            className={`ctl-admin-bottom-nav__item${
              isActive ? ' ctl-admin-bottom-nav__item--active' : ''
            }`}
            key={item.label}
            onClick={() => history.push(item.path)}
            type="button"
          >
            {isActive ? <span className="ctl-admin-bottom-nav__indicator" /> : null}
            <IonIcon icon={item.icon} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default AdminBottomNav;
