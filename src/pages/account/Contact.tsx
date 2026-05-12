import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  businessOutline,
  call,
  callOutline,
  gitNetworkOutline,
  globeOutline,
  locationOutline,
  mailOutline,
  navigateOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import AppHeader from '../../components/header/AppHeader';
import './account.css';

const branches = [
  {
    title: 'Chandigarh Branch Office',
    address: 'Plot No 92, Godown Area, Bhabat, Zirakpur, Punjab - 140603',
    phones: ['(+91) 921 629 9232', '(+91) 921 632 5986']
  },
  {
    title: 'Delhi Branch Office',
    address: 'F-297, Tuglakabad, Village T Bad Kanger Mohalla, South Delhi, Delhi - 110044',
    phones: ['+91 87250 12119']
  },
  {
    title: 'Jammu Branch Office',
    address: '700 sqft Ground Floor, Malik Market Near Gurudwara Guru Teg Bahadur Nagar, Narwal Bypass, Jammu',
    phones: ['+91 92163 25987']
  },
  {
    title: 'Himachal Branch',
    address: 'Opposite to Nissan Showroom, Mandi Gutkar Road, Gutkar - 175021',
    phones: ['+91 98153 61900']
  },
  {
    title: 'Dehradun Branch Office',
    address: 'A-33 Transport Nagar Opposite VRL Logistics, Dehradun',
    phones: ['+91 95011 13443']
  }
];

const mapsUrl = 'https://maps.google.com/?q=Near+Modi+Kunj+Society+Godown+Area+Bhabat+Zirakpur+Punjab+140603';

const Contact: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <AppHeader
        brandTrailing="user"
        onProfile={() => history.push('/profile')}
        title="Chandigarh Trade Link"
        variant="brand"
      />
      <IonContent className="ctl-account-content" fullscreen>
        <main className="ctl-account">
          <section className="ctl-account-title">
            <h1>Contact Us</h1>
            <p>Get in touch with our head office or visit any of our branch locations.</p>
          </section>

          <section className="ctl-account-section">
            <h2 className="ctl-account-section-title">
              <span>
                <IonIcon icon={businessOutline} />
              </span>
              Head Office (Primary)
            </h2>

            <article className="ctl-contact-card ctl-contact-card--primary">
              <h2>Punjab Head Office</h2>

              <div className="ctl-contact-row">
                <IonIcon icon={locationOutline} />
                <p>Near Modi Kunj Society, Godown Area, Bhabat, Zirakpur, Punjab 140603</p>
              </div>

              <div className="ctl-contact-methods">
                <a className="ctl-contact-method" href="tel:+919216325986">
                  <span className="ctl-contact-method__icon">
                    <IonIcon icon={callOutline} />
                  </span>
                  <span>+91 92163 25986</span>
                </a>
                <a className="ctl-contact-method ctl-contact-method--regular" href="mailto:ctlchd@gmail.com">
                  <span className="ctl-contact-method__icon">
                    <IonIcon icon={mailOutline} />
                  </span>
                  <span>ctlchd@gmail.com</span>
                </a>
                <a className="ctl-contact-method ctl-contact-method--regular" href="https://chandigarhtradelink.com">
                  <span className="ctl-contact-method__icon">
                    <IonIcon icon={globeOutline} />
                  </span>
                  <span>chandigarhtradelink.com</span>
                </a>
              </div>

              <a className="ctl-account-action ctl-account-action--primary" href={mapsUrl}>
                <IonIcon icon={navigateOutline} />
                Get Directions
              </a>
            </article>
          </section>

          <section className="ctl-account-section">
            <h2 className="ctl-account-section-title">
              <span>
                <IonIcon icon={gitNetworkOutline} />
              </span>
              Other Branches
            </h2>

            <div className="ctl-branch-list">
              {branches.map((branch) => (
                <article className="ctl-contact-card ctl-contact-card--branch" key={branch.title}>
                  <h2>{branch.title}</h2>

                  <div className="ctl-contact-row">
                    <IonIcon icon={locationOutline} />
                    <p>{branch.address}</p>
                  </div>

                  <div className="ctl-contact-methods">
                    {branch.phones.map((phone) => (
                      <a
                        className="ctl-contact-method"
                        href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                        key={phone}
                      >
                        <span className="ctl-contact-method__icon">
                          <IonIcon icon={callOutline} />
                        </span>
                        <span>{phone}</span>
                      </a>
                    ))}
                  </div>

                  <a className="ctl-account-action" href={`https://maps.google.com/?q=${encodeURIComponent(branch.address)}`}>
                    <IonIcon icon={navigateOutline} />
                    Get Directions
                  </a>
                </article>
              ))}
            </div>
          </section>

          <a aria-label="Call head office" className="ctl-floating-call" href="tel:+919216325986">
            <IonIcon icon={call} />
          </a>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Contact;
