export const sanitizeQuantityInput = (value: string) => {
  const numericValue = value.replace(/[^\d.]/g, '');
  const [integerPart, ...decimalParts] = numericValue.split('.');

  if (!decimalParts.length) {
    return integerPart;
  }

  return `${integerPart}.${decimalParts.join('')}`;
};

export const isPositiveQuantity = (value: string) => {
  const numericValue = Number(value.trim());

  return Number.isFinite(numericValue) && numericValue > 0;
};
