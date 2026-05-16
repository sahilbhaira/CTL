import { IonIcon } from '@ionic/react';
import {
  personOutline,
  peopleOutline,
  speedometerOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';

export type AdminTab = 'Dashboard' | 'Inquiries' | 'Profile';

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
  { icon: peopleOutline, label: 'Inquiries', path: '/admin/inquiries' },
  { icon: personOutline, label: 'Profile', path: '/admin/profile' }
];

const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeTab }) => {
  const history = useHistory();

  return (
    <nav className="ctl-admin-bottom-nav" aria-label="Admin navigation">
      {adminNavItems.map((item) => {
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
