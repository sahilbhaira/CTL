import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
    chevronForwardOutline,
    searchOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import AppHeader from '../components/header/AppHeader';
import {
    getServiceIcon,
    getServicePath,
    serviceCategories
} from '../data/servicesProducts';
import './catalog.css';

const Services: React.FC = () => {
    const history = useHistory();

    return (
        <IonPage>
            <AppHeader title="Chandigarh Trade Link" userInitials="RS" variant="brand" />
            <IonContent className="ctl-catalog-content" fullscreen>
                <main className="ctl-catalog">
                    <section className="ctl-catalog-heading">
                        <h1>Our Services</h1>
                        <div className="ctl-catalog-search">
                            <IonIcon icon={searchOutline} />
                            <span>Search service...</span>
                        </div>
                    </section>

                    <section className="ctl-card-list" aria-label="Service categories">
                        {serviceCategories.map((service) => (
                            <article className="ctl-service-list-card" key={service.id}>
                                <div className="ctl-service-list-card__main">
                                    <div className="ctl-service-list-card__icon">
                                        <IonIcon icon={getServiceIcon(service.id)} />
                                    </div>
                                    <div>
                                        <h2>{service.name}</h2>
                                        <p>{service.description}</p>
                                    </div>
                                </div>
                                <button
                                    className="ctl-service-list-card__action"
                                    onClick={() => history.push(getServicePath(service.id))}
                                    type="button"
                                >
                                    VIEW PRODUCTS
                                    <IonIcon icon={chevronForwardOutline} />
                                </button>
                            </article>
                        ))}
                    </section>
                </main>
            </IonContent>
        </IonPage>
    );
};

export default Services;
