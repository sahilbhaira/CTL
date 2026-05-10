import {
  brushOutline,
  constructOutline,
  cubeOutline,
  flaskOutline,
  homeOutline,
  layersOutline,
  linkOutline,
  pulseOutline,
  settingsOutline,
  umbrellaOutline
} from 'ionicons/icons';
import servicesProductsJson from '../services-products.json';

export type ProductTab = 'overview' | 'details' | 'application' | 'document';

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  productIds: string[];
}

export interface ProductKeyValue {
  label: string;
  value: string;
}

export interface ProductApplicationStep {
  step: number;
  title: string;
  description: string;
}

export interface ProductDocument {
  label: string;
  type: string;
  url: string;
}

export interface Product {
  id: string;
  serviceId: string;
  name: string;
  tagline: string;
  thumbnail: string;
  tabs: {
    overview: {
      text: string;
      usage: string[];
      advantages: string[];
      packaging: string;
      colour: string;
    };
    details: {
      keyValues: ProductKeyValue[];
    };
    application: {
      steps: ProductApplicationStep[];
      consumption: ProductKeyValue;
      notes: string | null;
    };
    documents: {
      files: ProductDocument[];
    };
  };
}

interface ServicesProductsData {
  services: ServiceCategory[];
  products: Product[];
}

const servicesProducts = servicesProductsJson as ServicesProductsData;

const serviceIcons: Record<string, string> = {
  'building-finishing': brushOutline,
  'concrete-admixture': flaskOutline,
  'concrete-essentials': cubeOutline,
  grouting: settingsOutline,
  'industrial-flooring': layersOutline,
  'repair-protection': constructOutline,
  roofing: homeOutline,
  'sealing-bonding': linkOutline,
  'structure-strengthening': pulseOutline,
  waterproofing: umbrellaOutline
};

export const serviceCategories = servicesProducts.services;
export const productCatalog = servicesProducts.products;

export const getServiceIcon = (serviceId: string) => serviceIcons[serviceId] ?? cubeOutline;

export const getServiceById = (serviceId: string | undefined) =>
  serviceCategories.find((service) => service.id === serviceId);

export const getProductById = (productId: string | undefined) =>
  productCatalog.find((product) => product.id === productId);

export const getProductsForService = (serviceId: string | undefined) => {
  const service = getServiceById(serviceId);

  if (!service) {
    return [];
  }

  return service.productIds
    .map((productId) => getProductById(productId))
    .filter((product): product is Product => Boolean(product));
};

export const getServicePath = (serviceId: string) => `/services/${serviceId}`;

export const getProductPath = (productId: string, tab?: ProductTab) => {
  if (!tab || tab === 'overview') {
    return `/products/${productId}`;
  }

  return `/products/${productId}/${tab}`;
};
