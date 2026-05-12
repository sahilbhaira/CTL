import {
  IonContent,
  IonIcon,
  IonPage
} from '@ionic/react';
import {
  mailOutline,
  personOutline,
  phonePortraitOutline,
  sendOutline
} from 'ionicons/icons';
import { useFormik, type FormikErrors } from 'formik';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router';
import AppHeader from '../../components/header/AppHeader';
import QuoteQuantityFields from '../../components/quote/QuoteQuantityFields';
import QuoteSelectField from '../../components/quote/QuoteSelectField';
import QuoteSuccessModal from '../../components/quote/QuoteSuccessModal';
import QuoteTextField from '../../components/quote/QuoteTextField';
import {
  getServiceById,
  productCatalog,
  serviceCategories
} from '../../data/servicesProducts';
import { formatQuotationReference } from '../../lib/quotation';
import { getUserDisplayName } from '../../lib/userProfile';
import { useInvokeEdgeFunctionMutation } from '../../services/api/edgeFunctionsApi';
import { useAuthStore } from '../../store/authStore';
import './quote.css';

interface QuotationValues {
  email: string;
  name: string;
  notes: string;
  phone: string;
  productIds: string[];
  productQuantities: Record<string, string>;
  serviceIds: string[];
}

type SubmitMessage = {
  text: string;
  type: 'error' | 'success';
};

interface QuotationResponse {
  id?: string;
  message?: string;
}

const initialServiceIds = ['concrete-admixture'];
const initialProductIds = ['sikacim', 'sika-plastiment-2001-ns'];

const validateQuotation = (values: QuotationValues) => {
  const errors: FormikErrors<QuotationValues> = {};
  const productQuantityErrors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'Enter a valid email';
  }

  if (!values.phone.trim()) {
    errors.phone = 'Phone is required';
  }

  if (!values.serviceIds.length) {
    errors.serviceIds = 'Select at least one service';
  }

  if (!values.productIds.length) {
    errors.productIds = 'Select at least one product';
  }

  values.productIds.forEach((productId) => {
    if (!values.productQuantities[productId]?.trim()) {
      productQuantityErrors[productId] = 'Quantity is required';
    }
  });

  if (Object.keys(productQuantityErrors).length) {
    errors.productQuantities = productQuantityErrors;
  }

  return errors;
};

const normalizeSelection = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  return value ? [String(value)] : [];
};

const getProductsForServices = (serviceIds: string[]) =>
  productCatalog.filter((product) => serviceIds.includes(product.serviceId));

const getInitialProductQuantities = (productIds: string[]) =>
  productIds.reduce<Record<string, string>>((acc, productId) => {
    acc[productId] = '';
    return acc;
  }, {});

const getProductQuantityError = (
  errors: unknown,
  productId: string
) =>
  typeof errors === 'object' && errors && productId in errors
    ? String((errors as Record<string, unknown>)[productId])
    : undefined;

const getStringError = (error: unknown) =>
  typeof error === 'string' ? error : undefined;

const RequestQuotation: React.FC = () => {
  const history = useHistory();
  const user = useAuthStore((state) => state.user);
  const [invokeEdgeFunction] = useInvokeEdgeFunctionMutation();
  const [successReferenceId, setSuccessReferenceId] = useState<string | null>(null);
  const initialValues = useMemo<QuotationValues>(
    () => ({
      email: user?.email ?? '',
      name: user ? getUserDisplayName(user) : '',
      notes: '',
      phone: '',
      productIds: initialProductIds,
      productQuantities: getInitialProductQuantities(initialProductIds),
      serviceIds: initialServiceIds
    }),
    [user]
  );

  const formik = useFormik<QuotationValues>({
    enableReinitialize: true,
    initialValues,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      try {
        const services = serviceCategories
          .filter((service) => values.serviceIds.includes(service.id))
          .map((service) => ({
            id: service.id,
            name: service.name
          }));

        const products = productCatalog
          .filter((product) => values.productIds.includes(product.id))
          .map((product) => ({
            id: product.id,
            name: product.name,
            quantity: values.productQuantities[product.id].trim(),
            serviceId: product.serviceId,
            serviceName: getServiceById(product.serviceId)?.name ?? ''
          }));

        const response = await invokeEdgeFunction({
          body: {
            customer: {
              email: values.email.trim(),
              name: values.name.trim(),
              phone: values.phone.trim()
            },
            notes: values.notes.trim(),
            products,
            services
          },
          functionName: 'request-quotation'
        }).unwrap() as QuotationResponse;

        helpers.setStatus(null);
        setSuccessReferenceId(formatQuotationReference(response.id));
        helpers.resetForm({ values: initialValues });
      } catch {
        helpers.setStatus({
          text: 'Unable to submit request right now. Please try again.',
          type: 'error'
        } satisfies SubmitMessage);
      }
    },
    validate: validateQuotation
  });

  const availableProducts = useMemo(
    () => getProductsForServices(formik.values.serviceIds),
    [formik.values.serviceIds]
  );
  const selectedServices = serviceCategories.filter((service) =>
    formik.values.serviceIds.includes(service.id)
  );
  const selectedProducts = availableProducts.filter((product) =>
    formik.values.productIds.includes(product.id)
  );
  const submitMessage = formik.status as SubmitMessage | null;
  const productQuantityErrors = formik.errors.productQuantities;
  const touchedProductQuantities = formik.touched.productQuantities;

  const handleServiceChange = (value: unknown) => {
    const nextServiceIds = normalizeSelection(value);
    const nextAvailableProductIds = getProductsForServices(nextServiceIds).map(
      (product) => product.id
    );
    const nextProductIds = formik.values.productIds.filter((productId) =>
      nextAvailableProductIds.includes(productId)
    );
    const nextProductQuantities = nextProductIds.reduce<Record<string, string>>(
      (acc, productId) => {
        acc[productId] = formik.values.productQuantities[productId] ?? '';
        return acc;
      },
      {}
    );

    formik.setFieldValue('serviceIds', nextServiceIds);
    formik.setFieldValue('productIds', nextProductIds);
    formik.setFieldValue('productQuantities', nextProductQuantities);
  };

  const handleProductChange = (value: unknown) => {
    const availableProductIds = availableProducts.map((product) => product.id);
    const nextProductIds = normalizeSelection(value).filter((productId) =>
      availableProductIds.includes(productId)
    );
    const nextProductQuantities = nextProductIds.reduce<Record<string, string>>(
      (acc, productId) => {
        acc[productId] = formik.values.productQuantities[productId] ?? '';
        return acc;
      },
      {}
    );

    formik.setFieldValue('productIds', nextProductIds);
    formik.setFieldValue('productQuantities', nextProductQuantities);
  };

  const handleProductQuantityBlur = (productId: string) => {
    formik.setFieldTouched(`productQuantities.${productId}`, true);
  };

  const handleProductQuantityChange = (productId: string, value: string) => {
    formik.setFieldValue(`productQuantities.${productId}`, value);
  };

  const isProductQuantityTouched = (productId: string) =>
    typeof touchedProductQuantities === 'object' &&
    Boolean(touchedProductQuantities?.[productId]);

  const handleSuccessClose = () => {
    setSuccessReferenceId(null);
  };

  const handleGoToQuotes = () => {
    setSuccessReferenceId(null);
    history.push('/quotes');
  };

  return (
    <IonPage>
      <AppHeader
        brandTrailing="user"
        onProfile={() => history.push('/profile')}
        title="Chandigarh Trade Link"
        variant="brand"
      />
      <IonContent className="ctl-account-content" fullscreen>
        <main className="ctl-account ctl-quote">
          <section className="ctl-account-title ctl-quote-title">
            <h1>Request Quotation</h1>
            <p>Fill out the form below to get a custom quote for your requirements.</p>
          </section>

          <form className="ctl-quote-form" noValidate onSubmit={formik.handleSubmit}>
            <QuoteTextField
              error={formik.errors.name}
              icon={personOutline}
              label="Name"
              name="name"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              placeholder="Enter your full name"
              touched={formik.touched.name}
              value={formik.values.name}
            />

            <QuoteTextField
              autoComplete="email"
              error={formik.errors.email}
              icon={mailOutline}
              label="Email"
              name="email"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              placeholder="Enter your email address"
              touched={formik.touched.email}
              type="email"
              value={formik.values.email}
            />

            <QuoteTextField
              error={formik.errors.phone}
              icon={phonePortraitOutline}
              inputMode="tel"
              label="Phone"
              name="phone"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              placeholder="+91 | Enter your phone number"
              touched={formik.touched.phone}
              type="tel"
              value={formik.values.phone}
            />

            <QuoteSelectField
              error={getStringError(formik.errors.serviceIds)}
              label="Service"
              name="serviceIds"
              onBlur={() => formik.setFieldTouched('serviceIds', true)}
              onValueChange={handleServiceChange}
              options={serviceCategories}
              placeholder="Select Services"
              selectedItems={selectedServices}
              touched={Boolean(formik.touched.serviceIds)}
              value={formik.values.serviceIds}
            />

            <QuoteSelectField
              emptyText="Select a service first"
              error={getStringError(formik.errors.productIds)}
              label="Product"
              name="productIds"
              onBlur={() => formik.setFieldTouched('productIds', true)}
              onValueChange={handleProductChange}
              options={availableProducts}
              placeholder="Select Products"
              selectedItems={selectedProducts}
              touched={Boolean(formik.touched.productIds)}
              value={formik.values.productIds}
            />

            <QuoteQuantityFields
              getError={(productId) =>
                getProductQuantityError(productQuantityErrors, productId)
              }
              isTouched={isProductQuantityTouched}
              onBlur={handleProductQuantityBlur}
              onChange={handleProductQuantityChange}
              products={selectedProducts}
              quantities={formik.values.productQuantities}
            />

            <QuoteTextField
              label="Notes"
              multiline
              name="notes"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              placeholder="Any specific requirements or instructions..."
              value={formik.values.notes}
            />

            {submitMessage ? (
              <p className={`ctl-quote-message ctl-quote-message--${submitMessage.type}`}>
                {submitMessage.text}
              </p>
            ) : null}

            <button className="ctl-quote-submit" disabled={formik.isSubmitting} type="submit">
              <IonIcon icon={sendOutline} />
              {formik.isSubmitting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
            </button>
          </form>
        </main>
      </IonContent>
      <QuoteSuccessModal
        isOpen={Boolean(successReferenceId)}
        onClose={handleSuccessClose}
        onGoToQuotes={handleGoToQuotes}
        referenceId={successReferenceId}
      />
    </IonPage>
  );
};

export default RequestQuotation;
