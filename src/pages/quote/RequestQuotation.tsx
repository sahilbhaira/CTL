import {
  IonContent,
  IonIcon,
  IonPage
} from '@ionic/react';
import {
  addOutline,
  mailOutline,
  personOutline,
  phonePortraitOutline,
  sendOutline
} from 'ionicons/icons';
import { useFormik, type FormikErrors } from 'formik';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import QuoteServiceBlock, {
  type QuoteServiceBlockValue
} from '../../components/quote/QuoteServiceBlock';
import QuoteSuccessModal from '../../components/quote/QuoteSuccessModal';
import QuoteTextField from '../../components/quote/QuoteTextField';
import {
  getProductById,
  getServiceById,
  getProductsForService,
  getProductQuantityUnit,
  type Product,
  productCatalog,
  serviceCategories
} from '../../data/servicesProducts';
import { goToPreviousPage } from '../../lib/navigation';
import { formatQuotationReference } from '../../lib/quotation';
import { getUserDisplayName } from '../../lib/userProfile';
import { useInvokeEdgeFunctionMutation } from '../../services/api/edgeFunctionsApi';
import { useAuthStore } from '../../store/authStore';
import {
  type QuoteDraftValues,
  useQuoteDraftStore
} from '../../store/quoteDraftStore';
import './quote.css';
import AppHeader from '../../components/header/AppHeader';

interface QuotationValues {
  email: string;
  name: string;
  notes: string;
  phone: string;
  serviceBlocks: QuoteServiceBlockValue[];
}

interface QuotationServiceBlockErrors {
  productIds?: string;
  productQuantities?: Record<string, string>;
  serviceId?: string;
}

type QuotationErrors = FormikErrors<QuotationValues> & {
  serviceBlocks?: QuotationServiceBlockErrors[];
};

type SubmitMessage = {
  text: string;
  type: 'error' | 'success';
};

interface QuotationResponse {
  id?: string;
  message?: string;
}

const createServiceBlock = (id: number | string): QuoteServiceBlockValue => ({
  id: `service-${id}`,
  productIds: [],
  productQuantities: {},
  serviceId: ''
});

const createPrefilledServiceBlock = (search: string): QuoteServiceBlockValue => {
  const params = new URLSearchParams(search);
  const requestedProduct = getProductById(params.get('productId') ?? undefined);
  const requestedService = getServiceById(
    requestedProduct?.serviceId ?? params.get('serviceId') ?? undefined
  );

  if (!requestedService) {
    return createServiceBlock(1);
  }

  const productIds =
    requestedProduct?.serviceId === requestedService.id ? [requestedProduct.id] : [];

  return {
    id: `service-${requestedService.id}`,
    productIds,
    productQuantities: productIds.reduce<Record<string, string>>((acc, productId) => {
      acc[productId] = '';
      return acc;
    }, {}),
    serviceId: requestedService.id
  };
};

const hasMeaningfulDraft = (values: QuotationValues) =>
  Boolean(
    values.name.trim() ||
      values.email.trim() ||
      values.phone.trim() ||
      values.notes.trim() ||
      values.serviceBlocks.some(
        (block) =>
          block.serviceId ||
          block.productIds.length ||
          Object.values(block.productQuantities).some((quantity) => quantity.trim())
      )
  );

const normalizeDraftValues = (
  draft: QuoteDraftValues | null,
  fallbackValues: QuotationValues
): QuotationValues => {
  if (!draft) {
    return fallbackValues;
  }

  const serviceBlocks = draft.serviceBlocks.length
    ? draft.serviceBlocks.map((block, index) => ({
        id: block.id || `service-${index + 1}`,
        productIds: Array.isArray(block.productIds) ? block.productIds.map(String) : [],
        productQuantities:
          block.productQuantities && typeof block.productQuantities === 'object'
            ? Object.fromEntries(
                Object.entries(block.productQuantities).map(([productId, quantity]) => [
                  productId,
                  String(quantity ?? '')
                ])
              )
            : {},
        serviceId: block.serviceId || ''
      }))
    : fallbackValues.serviceBlocks;

  const normalizedValues = {
    email: draft.email || fallbackValues.email,
    name: draft.name || fallbackValues.name,
    notes: draft.notes ?? '',
    phone: draft.phone ?? '',
    serviceBlocks
  };

  return hasMeaningfulDraft(normalizedValues) ? normalizedValues : fallbackValues;
};

const mergeServiceBlockIntoValues = (
  values: QuotationValues,
  serviceBlock: QuoteServiceBlockValue
): QuotationValues => {
  if (!serviceBlock.serviceId) {
    return values;
  }

  const serviceBlocks = [...values.serviceBlocks];
  const existingServiceIndex = serviceBlocks.findIndex(
    (block) => block.serviceId === serviceBlock.serviceId
  );
  const blankServiceIndex = serviceBlocks.findIndex((block) => !block.serviceId);
  const targetIndex =
    existingServiceIndex >= 0
      ? existingServiceIndex
      : blankServiceIndex >= 0
        ? blankServiceIndex
        : serviceBlocks.length;
  const existingBlock = serviceBlocks[targetIndex] ?? {
    id: serviceBlock.id,
    productIds: [],
    productQuantities: {},
    serviceId: serviceBlock.serviceId
  };
  const productIds = [...existingBlock.productIds];
  const productQuantities = { ...existingBlock.productQuantities };

  serviceBlock.productIds.forEach((productId) => {
    if (!productIds.includes(productId)) {
      productIds.push(productId);
    }

    productQuantities[productId] =
      productQuantities[productId] ?? serviceBlock.productQuantities[productId] ?? '';
  });

  serviceBlocks[targetIndex] = {
    ...existingBlock,
    id: existingBlock.id || serviceBlock.id,
    productIds,
    productQuantities,
    serviceId: serviceBlock.serviceId
  };

  return {
    ...values,
    serviceBlocks
  };
};

const validateQuotation = (values: QuotationValues) => {
  const errors: QuotationErrors = {};
  const serviceBlockErrors: QuotationServiceBlockErrors[] = [];
  const selectedServiceIds = values.serviceBlocks
    .map((block) => block.serviceId)
    .filter(Boolean);

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

  if (!values.serviceBlocks.length) {
    errors.serviceBlocks = [{ serviceId: 'Select at least one service' }];
  }

  values.serviceBlocks.forEach((block, index) => {
    const blockErrors: QuotationServiceBlockErrors = {};
    const productQuantityErrors: Record<string, string> = {};

    if (!block.serviceId) {
      blockErrors.serviceId = 'Select a service';
    } else if (
      selectedServiceIds.filter((serviceId) => serviceId === block.serviceId).length > 1
    ) {
      blockErrors.serviceId = 'This service is already added';
    }

    if (!block.productIds.length) {
      blockErrors.productIds = 'Select at least one product';
    }

    block.productIds.forEach((productId) => {
      if (!block.productQuantities[productId]?.trim()) {
        productQuantityErrors[productId] = 'Quantity is required';
      }
    });

    if (Object.keys(productQuantityErrors).length) {
      blockErrors.productQuantities = productQuantityErrors;
    }

    if (Object.keys(blockErrors).length) {
      serviceBlockErrors[index] = blockErrors;
    }
  });

  if (serviceBlockErrors.length) {
    errors.serviceBlocks = serviceBlockErrors;
  }

  return errors;
};

const formatQuantityWithUnit = (quantity: string, unit: string) => {
  const trimmedQuantity = quantity.trim();

  if (!trimmedQuantity) {
    return '';
  }

  return `${trimmedQuantity} ${unit}`;
};

const RequestQuotation: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const user = useAuthStore((state) => state.user);
  const clearQuoteDraft = useQuoteDraftStore((state) => state.clearDraft);
  const setQuoteDraft = useQuoteDraftStore((state) => state.setDraft);
  const [invokeEdgeFunction] = useInvokeEdgeFunctionMutation();
  const [successReferenceId, setSuccessReferenceId] = useState<string | null>(null);
  const skipNextDraftSaveRef = useRef(false);
  const userId = user?.id ?? null;
  const savedDraft = useQuoteDraftStore((state) => state.getDraftForUser(userId));
  const initialValues = useMemo<QuotationValues>(() => {
    const prefilledBlock = createPrefilledServiceBlock(location.search);

    const fallbackValues = {
      email: user?.email ?? '',
      name: user ? getUserDisplayName(user) : '',
      notes: '',
      phone: '',
      serviceBlocks: [prefilledBlock]
    };

    const draftValues = normalizeDraftValues(savedDraft, fallbackValues);

    return mergeServiceBlockIntoValues(draftValues, prefilledBlock);
  }, [location.search, user, savedDraft]);

  const formik = useFormik<QuotationValues>({
    enableReinitialize: true,
    initialValues,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      try {
        const selectedServiceIds = values.serviceBlocks.map((block) => block.serviceId);
        const services = serviceCategories
          .filter((service) => selectedServiceIds.includes(service.id))
          .map((service) => ({
            id: service.id,
            name: service.name
          }));

        const products = values.serviceBlocks.flatMap((block) =>
          block.productIds
            .map((productId) => productCatalog.find((product) => product.id === productId))
            .filter((product): product is Product => Boolean(product))
            .map((product) => ({
              id: product.id,
              name: product.name,
              quantity: formatQuantityWithUnit(
                block.productQuantities[product.id] ?? '',
                getProductQuantityUnit(product)
              ),
              serviceId: product.serviceId,
              serviceName: getServiceById(product.serviceId)?.name ?? ''
            }))
        );

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
        clearQuoteDraft();
        skipNextDraftSaveRef.current = true;
        helpers.resetForm({
          values: {
            email: user?.email ?? '',
            name: user ? getUserDisplayName(user) : '',
            notes: '',
            phone: '',
            serviceBlocks: [createServiceBlock(1)]
          }
        });
      } catch {
        helpers.setStatus({
          text: 'Unable to submit request right now. Please try again.',
          type: 'error'
        } satisfies SubmitMessage);
      }
    },
    validate: validateQuotation
  });

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (skipNextDraftSaveRef.current) {
      skipNextDraftSaveRef.current = false;
      return;
    }

    setQuoteDraft(formik.values, userId);
  }, [formik.values, isAuthReady, setQuoteDraft, userId]);

  const submitMessage = formik.status as SubmitMessage | null;
  const serviceBlockErrors = Array.isArray(formik.errors.serviceBlocks)
    ? (formik.errors.serviceBlocks as QuotationServiceBlockErrors[])
    : [];
  const serviceBlockTouched = Array.isArray(formik.touched.serviceBlocks)
    ? formik.touched.serviceBlocks
    : [];

  const updateServiceBlocks = async (blocks: QuoteServiceBlockValue[]) => {
    await formik.setFieldValue('serviceBlocks', blocks, true);
  };

  const handleAddService = () => {
    formik.setFieldValue('serviceBlocks', [
      ...formik.values.serviceBlocks,
      createServiceBlock(Date.now())
    ]);

    formik.setFieldTouched('serviceBlocks', true, false);
  };

  const handleRemoveService = (index: number) => {
    updateServiceBlocks(
      formik.values.serviceBlocks.filter((_, blockIndex) => blockIndex !== index)
    );
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const nextBlocks = formik.values.serviceBlocks.map((block, blockIndex) =>
      blockIndex === index
        ? {
            ...block,
            productIds: [],
            productQuantities: {},
            serviceId
          }
        : block
    );

    updateServiceBlocks(nextBlocks);
  };

  const handleProductChange = (index: number, productIds: string[]) => {
    const block = formik.values.serviceBlocks[index];
    const availableProductIds = getProductsForService(block.serviceId).map(
      (product) => product.id
    );
    const nextProductIds = productIds.filter((productId) =>
      availableProductIds.includes(productId)
    );
    const nextProductQuantities = nextProductIds.reduce<Record<string, string>>(
      (acc, productId) => {
        acc[productId] = block.productQuantities[productId] ?? '';
        return acc;
      },
      {}
    );

    const nextBlocks = formik.values.serviceBlocks.map((serviceBlock, blockIndex) =>
      blockIndex === index
        ? {
            ...serviceBlock,
            productIds: nextProductIds,
            productQuantities: nextProductQuantities
          }
        : serviceBlock
    );

    updateServiceBlocks(nextBlocks);
  };

  const handleProductRemove = (index: number, productId: string) => {
    const block = formik.values.serviceBlocks[index];
    const nextProductQuantities = { ...block.productQuantities };
    delete nextProductQuantities[productId];

    const nextBlocks = formik.values.serviceBlocks.map((serviceBlock, blockIndex) =>
      blockIndex === index
        ? {
            ...serviceBlock,
            productIds: serviceBlock.productIds.filter(
              (selectedProductId) => selectedProductId !== productId
            ),
            productQuantities: nextProductQuantities
          }
        : serviceBlock
    );

    updateServiceBlocks(nextBlocks);
  };

  const handleProductQuantityChange = (
    index: number,
    productId: string,
    value: string
  ) => {
    const nextBlocks = formik.values.serviceBlocks.map((block, blockIndex) =>
      blockIndex === index
        ? {
            ...block,
            productQuantities: {
              ...block.productQuantities,
              [productId]: value
            }
          }
        : block
    );

    updateServiceBlocks(nextBlocks);
  };

  const getServiceOptionsForBlock = (index: number) => {
    const otherSelectedServiceIds = new Set(
      formik.values.serviceBlocks
        .filter((_, blockIndex) => blockIndex !== index)
        .map((block) => block.serviceId)
        .filter(Boolean)
    );

    return serviceCategories.filter((service) => !otherSelectedServiceIds.has(service.id));
  };

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
        brandLeading="back"
        onBack={() => goToPreviousPage(history)}
        title="Request Quotation"
        variant="brand"
      />
      <IonContent className="ctl-account-content ctl-quote-content" fullscreen>
        <main className="ctl-account ctl-quote">
          {/* <div className="ctl-quote-topbar">
            <button
              aria-label="Go back"
              className="ctl-quote-back"
              onClick={handleBack}
              type="button"
            >
              <IonIcon icon={arrowBackOutline} />
            </button>
          </div> */}

          {/* <section className="ctl-account-title ctl-quote-title">
            <h1>Request Quotation</h1>
            <p>Fill out the form below to get a custom quote for your requirements.</p>
          </section> */}

          <form className="ctl-quote-form" noValidate onSubmit={formik.handleSubmit}>
            

            <div className="ctl-quote-service-list">
              {formik.values.serviceBlocks.map((block, index) => {
                const blockErrors = serviceBlockErrors[index] ?? {};
                const blockTouched = serviceBlockTouched[index] as
                  | {
                      productIds?: boolean;
                      productQuantities?: Record<string, boolean>;
                      serviceId?: boolean;
                    }
                  | undefined;
                const productOptions = getProductsForService(block.serviceId);
                const selectedProducts = productOptions.filter((product) =>
                  block.productIds.includes(product.id)
                );

                return (
                  <QuoteServiceBlock
                    block={block}
                    canRemove={formik.values.serviceBlocks.length > 1}
                    index={index}
                    isQuantityTouched={(productId) =>
                      Boolean(blockTouched?.productQuantities?.[productId])
                    }
                    key={block.id}
                    onProductBlur={(productId) => {
                      void formik.setFieldTouched(
                        `serviceBlocks.${index}.productQuantities.${productId}`,
                        true
                      );
                    }}
                    onProductChange={(productIds) => handleProductChange(index, productIds)}
                    onProductRemove={(productId) => handleProductRemove(index, productId)}
                    onProductQuantityChange={(productId, value) =>
                      handleProductQuantityChange(index, productId, value)
                    }
                    onProductTouched={() => {
                      void formik.setFieldTouched(
                        `serviceBlocks.${index}.productIds`,
                        true
                      );
                    }}
                    onRemove={() => handleRemoveService(index)}
                    onServiceChange={(serviceId) => handleServiceChange(index, serviceId)}
                    onServiceTouched={() => {
                      void formik.setFieldTouched(
                        `serviceBlocks.${index}.serviceId`,
                        true
                      );
                    }}
                    productError={blockErrors.productIds}
                    productOptions={productOptions}
                    productTouched={Boolean(blockTouched?.productIds)}
                    quantityErrors={blockErrors.productQuantities ?? {}}
                    selectedProducts={selectedProducts}
                    selectedService={getServiceById(block.serviceId)}
                    serviceError={blockErrors.serviceId}
                    serviceOptions={getServiceOptionsForBlock(index)}
                    serviceTouched={Boolean(blockTouched?.serviceId)}
                  />
                );
              })}
            </div>

            <button
              className="ctl-quote-add-service"
              disabled={formik.values.serviceBlocks.length >= serviceCategories.length}
              onClick={handleAddService}
              type="button"
            >
              <IonIcon icon={addOutline} />
              Add Service
            </button>

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
