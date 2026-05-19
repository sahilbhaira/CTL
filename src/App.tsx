import { Redirect, Route, useLocation } from 'react-router-dom';
import type { PropsWithChildren, ReactElement } from 'react';
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

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
import './styles/page-shell.css';
import QuoteLoginPrompt from './components/auth/QuoteLoginPrompt';
import BottomNav from './components/navigation/BottomNav';
import NavigationMenu from './components/navigation/NavigationMenu';
import Contact from './pages/account/Contact';
import Profile from './pages/account/Profile';
import AdminAcceptedQuotes from './pages/admin/AdminAcceptedQuotes';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminNegotiations from './pages/admin/AdminNegotiations';
import AdminProfile from './pages/admin/AdminProfile';
import AdminInquiries from './pages/admin/inquiries/AdminInquiries';
import AdminQuote from './pages/admin/quote/AdminQuote';
import AdminQuotePreview from './pages/admin/quote/AdminQuotePreview';
import AuthCallback from './pages/auth/AuthCallback';
import ForgotPassword from './pages/auth/ForgotPassword';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import Home from './pages/home/Home';
import ProductDetails from './pages/products/ProductDetails';
import RequestQuotation from './pages/quote/RequestQuotation';
import MyQuotes from './pages/quotes/MyQuotes';
import NegotiateQuote from './pages/quotes/NegotiateQuote';
import ServiceProducts from './pages/services/ServiceProducts';
import Services from './pages/services/Services';
import { useAuthBootstrap } from './hooks/useAuthBootstrap';
import { isAdminUser } from './lib/admin';
import { hasAuthRedirectParams } from './services/authService';
import { useAuthStore } from './store/authStore';

setupIonicReact();

const authRoutes = [
  '/auth/callback',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
];
type TabsWithIdProps = PropsWithChildren<{ id: string }>;
const IonTabsWithId = IonTabs as unknown as (props: TabsWithIdProps) => ReactElement;

const AppTabs: React.FC = () => {
  const location = useLocation();
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const isGuest = useAuthStore((state) => state.isGuest);
  const user = useAuthStore((state) => state.user);
  const isAuthRoute = authRoutes.some((route) => location.pathname.startsWith(route));
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isFocusedQuoteRoute = location.pathname === '/quote';
  const isAdmin = isAdminUser(user);
  const shouldHideBottomNav =
    isAuthRoute ||
    isAdminRoute ||
    isFocusedQuoteRoute ||
    location.pathname.startsWith('/products/');
  const authenticatedHomePath = isAdmin ? '/admin/dashboard' : '/home';
  const getLoginRedirectLocation = (routeLocation: typeof location) => ({
    pathname: '/login',
    state: {
      from: `${routeLocation.pathname}${routeLocation.search}`
    }
  });
  const renderGuestOnlyPage = (Component: React.FC) => {
    if (!isAuthReady) {
      return null;
    }

    if (user) {
      return <Redirect to={authenticatedHomePath} />;
    }

    return <Component />;
  };

  const renderCustomerPage = (Component: React.FC, routeLocation: typeof location) => {
    if (!isAuthReady) {
      return null;
    }

    if (!user) {
      if (isGuest) {
        return <Redirect to="/home" />;
      }

      if (isAuthRoute) {
        return null;
      }

      return <Redirect to={getLoginRedirectLocation(routeLocation)} />;
    }

    if (isAdmin) {
      return <Redirect to="/admin/dashboard" />;
    }

    return <Component />;
  };

  const renderResetPasswordPage = (routeLocation: typeof location) => {
    if (!isAuthReady) {
      return null;
    }

    if (
      user ||
      hasAuthRedirectParams(routeLocation.search, routeLocation.hash)
    ) {
      return <ResetPassword />;
    }

    if (isGuest) {
      return <Redirect to="/home" />;
    }

    return <Redirect to={getLoginRedirectLocation(routeLocation)} />;
  };

  const renderAdminPage = (Component: React.FC, routeLocation: typeof location) => {
    if (!isAuthReady) {
      return null;
    }

    if (!isAdmin) {
      if (!user && isAuthRoute) {
        return null;
      }

      return (
        <Redirect
          to={user || isGuest ? '/home' : getLoginRedirectLocation(routeLocation)}
        />
      );
    }

    return <Component />;
  };

  return (
    <IonTabsWithId id="main-content">

      <IonRouterOutlet>
        <Route path="/auth/callback" component={AuthCallback} exact />
        <Route path="/login" render={() => renderGuestOnlyPage(Login)} exact />
        <Route path="/register" render={() => renderGuestOnlyPage(Register)} exact />
        <Route
          path="/forgot-password"
          render={() => renderGuestOnlyPage(ForgotPassword)}
          exact
        />
        <Route
          path="/reset-password"
          render={({ location: routeLocation }) => renderResetPasswordPage(routeLocation)}
          exact
        />
        <Route path="/home" component={Home} exact />
        <Route path="/services" component={Services} exact />
        <Route path="/services/:serviceId" component={ServiceProducts} exact />
        <Route path="/products/:productId/:tab?" component={ProductDetails} exact />
        <Route path="/contact" component={Contact} exact />
        <Route
          path="/profile"
          render={() => {
            if (!isAuthReady) {
              return null;
            }

            if (isAdmin) {
              return <Redirect to="/admin/profile" />;
            }

            return <Profile />;
          }}
          exact
        />
        <Route
          path="/quote"
          render={({ location: routeLocation }) =>
            renderCustomerPage(RequestQuotation, routeLocation)
          }
          exact
        />
        <Route
          path="/quotes"
          render={({ location: routeLocation }) => renderCustomerPage(MyQuotes, routeLocation)}
          exact
        />
        <Route
          path="/quotes/:quoteId/negotiate"
          render={({ location: routeLocation }) =>
            renderCustomerPage(NegotiateQuote, routeLocation)
          }
          exact
        />
        <Route path="/status" render={() => <Redirect to="/quotes" />} exact />
        <Route
          path="/admin/dashboard"
          render={({ location: routeLocation }) =>
            renderAdminPage(AdminDashboard, routeLocation)
          }
          exact
        />
        <Route
          path="/admin/inquiries"
          render={({ location: routeLocation }) =>
            renderAdminPage(AdminInquiries, routeLocation)
          }
          exact
        />
        <Route
          path="/admin/leads"
          render={({ location: routeLocation }) => (
            <Redirect to={`/admin/inquiries${routeLocation.search}`} />
          )}
          exact
        />
        <Route
          path="/admin/negotiations/:quoteId"
          render={({ location: routeLocation }) =>
            renderAdminPage(AdminNegotiations, routeLocation)
          }
          exact
        />
        <Route
          path="/admin/negotiations"
          render={({ location: routeLocation }) =>
            renderAdminPage(AdminNegotiations, routeLocation)
          }
          exact
        />
        <Route
          path="/admin/accepted"
          render={({ location: routeLocation }) =>
            renderAdminPage(AdminAcceptedQuotes, routeLocation)
          }
          exact
        />
        <Route
          path="/admin/quote/:quoteId?"
          render={({ location: routeLocation }) => renderAdminPage(AdminQuote, routeLocation)}
          exact
        />
        <Route
          path="/admin/quote-preview/:quoteId?"
          render={({ location: routeLocation }) =>
            renderAdminPage(AdminQuotePreview, routeLocation)
          }
          exact
        />
        <Route
          path="/admin/profile"
          render={({ location: routeLocation }) =>
            renderAdminPage(AdminProfile, routeLocation)
          }
          exact
        />
        <Route path="/admin" render={() => <Redirect to="/admin/dashboard" />} exact />

        <Route
          path="/"
          render={() => {
            if (!isAuthReady) {
              return null;
            }

            if (isAdmin) {
              return <Redirect to="/admin/dashboard" />;
            }

            return <Redirect to={user || isGuest ? '/home' : '/login'} />;
          }}
          exact
        />
      </IonRouterOutlet>

      <BottomNav hidden={shouldHideBottomNav} variant="customer" />

    </IonTabsWithId>
  );
};

const App: React.FC = () => {
  useAuthBootstrap();

  return (
    <IonApp>
      <IonReactRouter>
        <NavigationMenu contentId="main-content" />
        <AppTabs />
        <QuoteLoginPrompt />
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
