import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
    chevronForwardOutline,
    searchOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import AppHeader from '../../components/header/AppHeader';
import {
    getServiceIcon,
    getServicePath,
    serviceCategories
} from '../../data/servicesProducts';
import './services.css';

const Services: React.FC = () => {
    const history = useHistory();

    return (
        <IonPage>
            <AppHeader title="Chandigarh Trade Link" variant="brand" />
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
                            <article
                                className="ctl-service-list-card"
                                key={service.id}
                                onClick={() => history.push(getServicePath(service.id))}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        history.push(getServicePath(service.id));
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="ctl-service-list-card__main">
                                    <div className="ctl-service-list-card__icon">
                                        <IonIcon icon={getServiceIcon(service.id)} />
                                    </div>
                                    <div>
                                        <h2>{service.name}</h2>
                                        <p>{service.description}</p>
                                    </div>
                                </div>
                                <IonIcon
                                    aria-hidden="true"
                                    className="ctl-service-list-card__chevron"
                                    icon={chevronForwardOutline}
                                />
                            </article>
                        ))}
                    </section>
                </main>
            </IonContent>
        </IonPage>
    );
};

export default Services;
