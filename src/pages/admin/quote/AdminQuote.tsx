import { IonIcon } from '@ionic/react';
import {
  addOutline,
  documentTextOutline,
  eyeOutline,
  lockClosedOutline,
  receiptOutline,
  refreshOutline,
  trashOutline
} from 'ionicons/icons';
import { getIn, useFormik } from 'formik';
import { useMemo } from 'react';
import { useHistory, useParams } from 'react-router';
import AdminPageShell from '../../../components/admin/AdminPageShell';
import {
  formatIndianCurrency,
  formatQuotationReference,
  getQuotationStatusGroup
} from '../../../lib/quotation';
import { getProductsForService } from '../../../data/servicesProducts';
import {
  type AdminQuotationRequest,
  useGetAdminQuotationRequestsQuery
} from '../../../services/api/edgeFunctionsApi';
import { useAdminQuotePreviewStore } from '../../../store/adminQuotePreviewStore';
import {
  calculateQuoteTotals,
  createBlankItem,
  createInitialValues,
  groupQuoteItemsByService,
  parseNumberInput,
  sanitizeNumericInput,
  toAmount,
  type QuoteFormValues,
  type QuoteItemValues
} from './adminQuoteUtils';
import '../admin.css';

interface RouteParams {
  quoteId?: string;
}

const getTargetQuote = (
  quotes: AdminQuotationRequest[],
  quoteId: string | undefined
) => {
  if (quoteId) {
    return quotes.find((quote) => quote.id === quoteId);
  }

  return (
    quotes.find((quote) => getQuotationStatusGroup(quote.status) === 'pending') ??
    quotes.find((quote) => getQuotationStatusGroup(quote.status) === 'negotiating') ??
    quotes[0]
  );
};

const AdminQuote: React.FC = () => {
  const history = useHistory();
  const { quoteId } = useParams<RouteParams>();
  const { data, error, isFetching, refetch } = useGetAdminQuotationRequestsQuery({
    limit: 100
  });
  const setPreview = useAdminQuotePreviewStore((state) => state.setPreview);
  const quote = useMemo(
    () => getTargetQuote(data?.quotes ?? [], quoteId),
    [data?.quotes, quoteId]
  );
  const initialValues = useMemo(() => createInitialValues(quote), [quote]);

  const formik = useFormik<QuoteFormValues>({
    enableReinitialize: true,
    initialValues,
    onSubmit: (values) => {
      if (!quote) {
        return;
      }

      setPreview(quote.id, values);
      history.push(`/admin/quote-preview/${quote.id}`);
    },
    validate: (values) => {
      const errors: Record<string, unknown> = {};
      const itemErrors = values.items.map((item) => {
        const nextErrors: Partial<QuoteItemValues> = {};

        if (!item.productName.trim()) {
          nextErrors.productName = 'Product name is required';
        }

        if (!item.quantity.trim()) {
          nextErrors.quantity = 'Quantity is required';
        }

        if (!toAmount(item.price)) {
          nextErrors.price = 'Enter a valid price';
        }

        return nextErrors;
      });

      if (itemErrors.some((item) => Object.keys(item).length)) {
        errors.items = itemErrors;
      }

      const deliveryAmount = parseNumberInput(values.deliveryCharges);
      const gstPercent = parseNumberInput(values.gstPercent);

      if (deliveryAmount === null || deliveryAmount < 0) {
        errors.deliveryCharges = 'Enter valid delivery charges';
      }

      if (gstPercent === null || gstPercent < 0) {
        errors.gstPercent = 'Enter valid GST';
      }

      if (!values.responseNote.trim()) {
        errors.responseNote = 'Notes are required';
      }

      return errors;
    }
  });

  const totals = calculateQuoteTotals(formik.values);
  const groupedItems = groupQuoteItemsByService(formik.values.items);

  const getFieldError = (name: string) => {
    const error = getIn(formik.errors, name);
    const touched = getIn(formik.touched, name);
    return touched && typeof error === 'string' ? error : null;
  };

  const getProductError = (index: number) => {
    const error = getIn(formik.errors, `items.${index}.productName`);
    const touched =
      getIn(formik.touched, `items.${index}.productName`) ||
      getIn(formik.touched, `items.${index}.productId`) ||
      formik.submitCount > 0;

    return touched && typeof error === 'string' ? error : null;
  };

  const setNumericField = (name: string, value: string) => {
    void formik.setFieldValue(name, sanitizeNumericInput(value));
  };

  const addProduct = (serviceId: string, serviceName: string) => {
    void formik.setFieldValue('items', [
      ...formik.values.items,
      createBlankItem(Date.now(), serviceId, serviceName)
    ]);
  };

  const handleProductSelect = (index: number, serviceId: string, productId: string) => {
    const product = getProductsForService(serviceId).find(
      (serviceProduct) => serviceProduct.id === productId
    );

    void formik.setFieldValue(`items.${index}.productId`, product?.id ?? '');
    void formik.setFieldValue(`items.${index}.productName`, product?.name ?? '');
  };

  const removeItem = (index: number) => {
    const item = formik.values.items[index];

    if (item?.locked) {
      return;
    }

    const nextItems = formik.values.items.filter((_, itemIndex) => itemIndex !== index);
    void formik.setFieldValue(
      'items',
      nextItems.length ? nextItems : [createBlankItem(Date.now())]
    );
  };

  const renderContent = () => {
    if (isFetching) {
      return (
        <section className="ctl-admin-content-stack">
          <article className="ctl-admin-skeleton ctl-admin-skeleton--large" />
        </section>
      );
    }

    if (error) {
      return (
        <section className="ctl-admin-empty">
          <h2>Unable to load quote</h2>
          <p>Quote data is loaded from the admin Edge Function.</p>
          <button className="ctl-admin-primary-action" onClick={() => refetch()} type="button">
            <IonIcon icon={refreshOutline} />
            Retry
          </button>
        </section>
      );
    }

    if (!quote) {
      return (
        <section className="ctl-admin-empty">
          <div className="ctl-admin-empty__icon">
            <IonIcon icon={documentTextOutline} />
          </div>
          <h2>No inquiry selected</h2>
          <p>Open an inquiry first, then create the customer quotation.</p>
          <button
            className="ctl-admin-primary-action"
            onClick={() => history.push('/admin/inquiries')}
            type="button"
          >
            View Inquiries
          </button>
        </section>
      );
    }

    return (
      <form
        className="ctl-admin-content-stack ctl-admin-create-quote"
        noValidate
        onSubmit={formik.handleSubmit}
      >
        <section className="ctl-admin-quote-context">
          <span>Inquiry Reference</span>
          <div>
            <strong>{quote.customer.name}</strong>
            <em>{formatQuotationReference(quote.id)}</em>
          </div>
        </section>

        <section className="ctl-admin-quote-form-section">
          <h3>Quote Items</h3>

          {groupedItems.map((group) => (
            <div className="ctl-admin-quote-service-group" key={`${group.serviceId}:${group.serviceName}`}>
              <div className="ctl-admin-quote-service-heading">
                <span>Service</span>
                <strong>{group.serviceName}</strong>
              </div>

              {group.items.map(({ index, item }) => (
                <article
                  className={`ctl-admin-quote-item${
                    item.locked ? ' ctl-admin-quote-item--locked' : ''
                  }`}
                  key={item.id}
                >
                  {item.locked ? (
                    <span className="ctl-admin-quote-lock">
                      <IonIcon icon={lockClosedOutline} />
                      Customer request
                    </span>
                  ) : (
                    <button
                      aria-label="Remove quote item"
                      className="ctl-admin-quote-remove"
                      onClick={() => removeItem(index)}
                      type="button"
                    >
                      <IonIcon icon={trashOutline} />
                    </button>
                  )}

                  <label className="ctl-admin-quote-field ctl-admin-quote-field--wide">
                    <span>Product Name</span>
                    {item.locked ? (
                      <input
                        name={`items.${index}.productName`}
                        onBlur={formik.handleBlur}
                        placeholder="Product name"
                        readOnly
                        value={item.productName}
                      />
                    ) : (
                      <select
                        name={`items.${index}.productId`}
                        onBlur={formik.handleBlur}
                        onChange={(event) =>
                          handleProductSelect(index, group.serviceId, event.target.value)
                        }
                        value={item.productId}
                      >
                        <option value="">Select product</option>
                        {getProductsForService(group.serviceId).map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                        {item.productId &&
                        !getProductsForService(group.serviceId).some(
                          (product) => product.id === item.productId
                        ) ? (
                          <option value={item.productId}>{item.productName}</option>
                        ) : null}
                      </select>
                    )}
                    {getProductError(index) ? <small>{getProductError(index)}</small> : null}
                  </label>

                  <div className="ctl-admin-quote-row">
                    <label className="ctl-admin-quote-field">
                      <span>Quantity</span>
                      <input
                        inputMode="numeric"
                        name={`items.${index}.quantity`}
                        onBlur={formik.handleBlur}
                        onChange={(event) =>
                          item.locked
                            ? undefined
                            : setNumericField(
                                `items.${index}.quantity`,
                                event.target.value
                              )
                        }
                        pattern="[0-9]*"
                        placeholder="50"
                        readOnly={item.locked}
                        value={item.quantity}
                      />
                      {getFieldError(`items.${index}.quantity`) ? (
                        <small>{getFieldError(`items.${index}.quantity`)}</small>
                      ) : null}
                    </label>

                    <label className="ctl-admin-quote-field">
                      <span>Price</span>
                      <div className="ctl-admin-quote-money">
                        <em>₹</em>
                        <input
                          inputMode="numeric"
                          name={`items.${index}.price`}
                          onBlur={formik.handleBlur}
                          onChange={(event) =>
                            setNumericField(`items.${index}.price`, event.target.value)
                          }
                          pattern="[0-9]*"
                          placeholder="0"
                          value={item.price}
                        />
                      </div>
                      {getFieldError(`items.${index}.price`) ? (
                        <small>{getFieldError(`items.${index}.price`)}</small>
                      ) : null}
                    </label>
                  </div>
                </article>
              ))}

              <button
                className="ctl-admin-add-item ctl-admin-add-item--service"
                onClick={() => addProduct(group.serviceId, group.serviceName)}
                type="button"
              >
                <IonIcon icon={addOutline} />
                ADD PRODUCT
              </button>
            </div>
          ))}
        </section>

        <section className="ctl-admin-quote-form-section">
          <h3>Additional Charges</h3>
          <div className="ctl-admin-quote-row">
            <label className="ctl-admin-quote-field">
              <span>Delivery Charges</span>
              <div className="ctl-admin-quote-money">
                <em>₹</em>
                <input
                  inputMode="numeric"
                  name="deliveryCharges"
                  onBlur={formik.handleBlur}
                  onChange={(event) => setNumericField('deliveryCharges', event.target.value)}
                  pattern="[0-9]*"
                  value={formik.values.deliveryCharges}
                />
              </div>
              {getFieldError('deliveryCharges') ? (
                <small>{getFieldError('deliveryCharges')}</small>
              ) : null}
            </label>

            <label className="ctl-admin-quote-field">
              <span>GST (%)</span>
              <div className="ctl-admin-quote-money ctl-admin-quote-money--suffix">
                <input
                  inputMode="numeric"
                  name="gstPercent"
                  onBlur={formik.handleBlur}
                  onChange={(event) => setNumericField('gstPercent', event.target.value)}
                  pattern="[0-9]*"
                  value={formik.values.gstPercent}
                />
                <em>%</em>
              </div>
              {getFieldError('gstPercent') ? <small>{getFieldError('gstPercent')}</small> : null}
            </label>
          </div>
        </section>

        <label className="ctl-admin-quote-field ctl-admin-quote-field--wide">
          <span>Notes to Customer</span>
          <textarea
            name="responseNote"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            value={formik.values.responseNote}
          />
          {getFieldError('responseNote') ? <small>{getFieldError('responseNote')}</small> : null}
        </label>

        <section className="ctl-admin-quote-total-card">
          <div>
            <span>Total Quote</span>
            <strong>{formatIndianCurrency(totals.total)}</strong>
          </div>
          <em>
            <IonIcon icon={receiptOutline} />
          </em>
        </section>

        <section className="ctl-admin-quote-breakdown">
          <div>
            <span>Subtotal</span>
            <strong>{formatIndianCurrency(totals.subtotal)}</strong>
          </div>
          <div>
            <span>Delivery</span>
            <strong>{formatIndianCurrency(totals.delivery)}</strong>
          </div>
          <div>
            <span>GST ({totals.gstRate}%)</span>
            <strong>{formatIndianCurrency(totals.gst)}</strong>
          </div>
        </section>

        <button
          className="ctl-admin-primary-action ctl-admin-primary-action--full"
          type="submit"
        >
          <IonIcon icon={eyeOutline} />
          PREVIEW QUOTATION
        </button>
      </form>
    );
  };

  return (
    <AdminPageShell
      activeTab="Inquiries"
      brandLeading="back"
      subtitle="Generate a formal quotation for the customer."
      title="Create Quote"
    >
      {renderContent()}
    </AdminPageShell>
  );
};

export default AdminQuote;
