export const formatQuotationReference = (id: string | undefined) => {
  if (!id) {
    return 'QT-PENDING';
  }

  return `QT-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
};

export type QuotationStatusGroup = 'accepted' | 'negotiating' | 'pending' | 'sent';

export const getQuotationStatusGroup = (status: string): QuotationStatusGroup => {
  if (status === 'accepted' || status === 'closed') {
    return 'accepted';
  }

  if (status === 'negotiating') {
    return 'negotiating';
  }

  if (status === 'quoted' || status === 'sent' || status === 'contacted') {
    return 'sent';
  }

  return 'pending';
};

export const formatQuotationStatus = (status: string) =>
  ({
    accepted: 'Accepted',
    closed: 'Accepted',
    contacted: 'Sent',
    negotiating: 'Negotiating',
    new: 'Pending',
    pending: 'Pending',
    quoted: 'Sent',
    sent: 'Sent'
  })[status] ??
  status
    .split('-')
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(' ');

export const formatIndianCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return 'Not quoted';
  }

  const amount = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(amount)) {
    return 'Not quoted';
  }

  return new Intl.NumberFormat('en-IN', {
    currency: 'INR',
    maximumFractionDigits: 0,
    style: 'currency'
  }).format(amount);
};
