import { Redirect, Route, useLocation } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  callOutline,
  documentTextOutline,
  gridOutline,
  homeOutline,
  pulseOutline
} from 'ionicons/icons';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';
import Services from './pages/Services';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Login from './pages/Login';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import ServiceProducts from './pages/ServiceProducts';

setupIonicReact();

const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

const AppTabs: React.FC = () => {
  const location = useLocation();
  const isAuthRoute = authRoutes.some((route) => location.pathname.startsWith(route));
  const shouldHideTabs = isAuthRoute || location.pathname.startsWith('/products/');

  return (
    <IonTabs>

      <IonRouterOutlet>
        <Route path="/login" component={Login} exact />
        <Route path="/register" component={Register} exact />
        <Route path="/forgot-password" component={ForgotPassword} exact />
        <Route path="/reset-password" component={ResetPassword} exact />
        <Route path="/home" component={Home} exact />
        <Route path="/services" component={Services} exact />
        <Route path="/services/:serviceId" component={ServiceProducts} exact />
        <Route path="/products/:productId/:tab?" component={ProductDetails} exact />
        <Route path="/contact" component={Contact} exact />
        <Route path="/profile" component={Profile} exact />
        <Route path="/quote" render={() => <Redirect to="/contact" />} exact />
        <Route path="/status" render={() => <Redirect to="/home" />} exact />

        <Redirect exact from="/" to="/login" />
      </IonRouterOutlet>

      <IonTabBar
        className={`ctl-tab-bar${shouldHideTabs ? ' ctl-tab-bar--hidden' : ''}`}
        slot="bottom"
      >
        <IonTabButton className="ctl-tab-button" tab="home" href="/home">
          <IonIcon icon={homeOutline} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>

        <IonTabButton className="ctl-tab-button" tab="services" href="/services">
          <IonIcon icon={gridOutline} />
          <IonLabel>Services</IonLabel>
        </IonTabButton>

        <IonTabButton className="ctl-tab-button ctl-quote-tab" tab="quote" href="/quote">
          <IonIcon className="ctl-quote-tab-icon" icon={documentTextOutline} />
          <IonLabel>QUOTE</IonLabel>
        </IonTabButton>

        <IonTabButton className="ctl-tab-button" tab="status" href="/status">
          <IonIcon icon={pulseOutline} />
          <IonLabel>Status</IonLabel>
        </IonTabButton>

        <IonTabButton className="ctl-tab-button" tab="contact" href="/contact">
          <IonIcon icon={callOutline} />
          <IonLabel>Contact</IonLabel>
        </IonTabButton>
      </IonTabBar>

    </IonTabs>
  );
};

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <AppTabs />
    </IonReactRouter>
  </IonApp>
);

export default App;
