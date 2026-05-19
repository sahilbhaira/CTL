import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage
} from '@ionic/react';
import {
  arrowForward,
  briefcaseOutline,
  compassOutline,
  gridOutline,
  peopleOutline,
  ribbonOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import AppHeader from '../../components/header/AppHeader';
import ServiceCard from '../../components/services/ServiceCard';
import {
  getServiceById,
  getServiceIcon,
  getServicePath,
  type ServiceCategory
} from '../../data/servicesProducts';
import { getUserDisplayName } from '../../lib/userProfile';
import { useAuthStore } from '../../store/authStore';
import { useQuoteAccessStore } from '../../store/quoteAccessStore';
import './home.css';

const homeServiceIds = [
  'concrete-admixture',
  'structure-strengthening',
  'waterproofing',
  'industrial-flooring'
];

const homeServiceImages: Record<string, string> = {
  'concrete-admixture':
    'https://chandigarhtradelink.com/wp-content/uploads/2025/10/download-5.png',
  'industrial-flooring':
    'https://chandigarhtradelink.com/wp-content/uploads/2025/10/Industrial-Flooring-Solutions-in-North-India.png',
  'structure-strengthening':
    'https://chandigarhtradelink.com/wp-content/uploads/2025/10/Structural-Strengthening-Services-in-North-India.png',
  waterproofing:
    'https://chandigarhtradelink.com/wp-content/uploads/2025/10/Waterproof-Coating-Services.png'
};

const Home: React.FC = () => {
  const history = useHistory();
  const user = useAuthStore((state) => state.user);
  const openQuoteLoginPrompt = useQuoteAccessStore((state) => state.openLoginPrompt);
  const displayName = getUserDisplayName(user);

  const services = homeServiceIds
    .map((serviceId) => getServiceById(serviceId))
    .filter((service): service is ServiceCategory => Boolean(service));
  const openQuote = () => {
    if (user) {
      history.push('/quote');
      return;
    }

    openQuoteLoginPrompt('/quote');
  };

  const proofPoints = [
    {
      title: 'A+ Grade Material Selection',
      desc: 'Only premium quality materials used.',
      icon: ribbonOutline
    },
    {
      title: 'Professional Guidance',
      desc: 'Expert engineers at every step.',
      icon: compassOutline
    },
    {
      title: '50+ Verified Contractors',
      desc: 'Trusted network of professionals.',
      icon: peopleOutline
    }
  ];

  const partners = [
    {
      name: 'L&T',
      logo: 'https://firebasestorage.googleapis.com/v0/b/banani-prod.appspot.com/o/reference-images%2F53b3f653-3a08-418f-9f5f-64f3f2fc20a9?alt=media&token=09b692f0-5c33-4ec9-bd8c-b3d1e374eab3'
    },
    {
      name: 'Suryacon',
      logo: 'https://firebasestorage.googleapis.com/v0/b/banani-prod.appspot.com/o/reference-images%2F7c300ffb-f63e-4fd1-b6fd-6e46c47f8815?alt=media&token=4df0ff9f-49d7-4915-8bfb-00d73130c1b4'
    },
    {
      name: 'Vardhman',
      logo: 'https://firebasestorage.googleapis.com/v0/b/banani-prod.appspot.com/o/reference-images%2Ffe5c8e43-f7f0-4c91-919d-425880a57282?alt=media&token=dc37620e-50de-4f60-8af4-7ad3b8d15468'
    },
    {
      name: 'Hyatt Regency',
      logo: 'https://firebasestorage.googleapis.com/v0/b/banani-prod.appspot.com/o/reference-images%2Feb4eeab7-8636-401d-942c-55aa8c57fd0f?alt=media&token=6afd7cda-deb4-41fd-9c12-7e3be344c879'
    },
    {
      name: 'Tata Projects',
      logo: 'https://firebasestorage.googleapis.com/v0/b/banani-prod.appspot.com/o/reference-images%2F13a4ae3b-2919-4371-ba23-39a7bd735f24?alt=media&token=202a45a5-2e9b-4195-9907-885429572eaa'
    }
  ];

  return (
    <IonPage>
      <AppHeader title="Chandigarh Trade Link" variant="brand" />

      <IonContent className="ctl-home-content" fullscreen>
        <main className="ctl-home">
          <section className="ctl-greeting">
            <h1>
              Hello, {displayName}! <span aria-hidden="true">👋</span>
            </h1>
            <p>What are you looking for today?</p>
          </section>

          <section className="ctl-hero-shell">
            <div className="ctl-hero-card">
              <div className="ctl-hero-image" />
              <div className="ctl-hero-fade" />

              <div className="ctl-hero-content">
                <div>
                  <span className="ctl-hero-tag">Expert Solutions</span>
                  <h2>Get Professional Work Done</h2>
                  <p>with Verified Experts</p>
                </div>

                <IonButton
                  className="ctl-quote-button"
                  onClick={openQuote}
                >
                  GET QUOTATION
                  <span className="ctl-quote-button__icon">
                    <IonIcon icon={arrowForward} />
                  </span>
                </IonButton>
              </div>
            </div>
          </section>

          <section className="ctl-section ctl-services-section">
            <div className="ctl-section-header">
              <h2>
                <IonIcon icon={gridOutline} />
                Services
              </h2>
              <button
                className="ctl-section-link"
                onClick={() => history.push('/services')}
                type="button"
              >
                See All
                <IonIcon icon={arrowForward} />
              </button>
            </div>

            <div className="ctl-services-grid">
              {services.map((service) => (
                <ServiceCard
                  icon={getServiceIcon(service.id)}
                  image={homeServiceImages[service.id]}
                  key={service.id}
                  onClick={() => history.push(getServicePath(service.id))}
                  serviceId={service.id}
                  title={service.name}
                />
              ))}
            </div>
          </section>

          <section className="ctl-section">
            <h2 className="ctl-section-title">
              <IonIcon icon={shieldCheckmarkOutline} />
              Why Us
            </h2>

            <div className="ctl-proof-card">
              {proofPoints.map((item) => (
                <div className="ctl-proof-item" key={item.title}>
                  <div className="ctl-proof-icon">
                    <IonIcon icon={item.icon} />
                  </div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ctl-partners-section">
            <div className="ctl-section ctl-partners-heading">
              <h2 className="ctl-section-title">
                <IonIcon icon={briefcaseOutline} />
                Clients & Partners
              </h2>
            </div>

            <div className="ctl-partner-rail">
              {partners.map((partner) => (
                <div className="ctl-partner-card" key={partner.name}>
                  <img alt={partner.name} src={partner.logo} />
                </div>
              ))}
            </div>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Home;
