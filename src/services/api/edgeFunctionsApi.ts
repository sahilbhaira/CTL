import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { createApi } from '@reduxjs/toolkit/query/react';
import axios, { AxiosError, type Method } from 'axios';
import { supabaseConfig } from '../../lib/env';
import { supabase } from '../../lib/supabase';

type QueryParams = Record<string, boolean | number | string | undefined>;

export type AdminQuotationStatus =
  | 'accepted'
  | 'closed'
  | 'contacted'
  | 'negotiating'
  | 'new'
  | 'pending'
  | 'quoted'
  | 'sent';

export type AdminQuotationFilter =
  | 'accepted'
  | 'all'
  | 'negotiating'
  | 'pending'
  | 'sent';

export interface AdminQuotationProduct {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  serviceId: string;
  serviceName: string;
}

export interface AdminQuotationCustomer {
  email: string;
  name: string;
  phone: string;
}

export interface AdminQuotationRequest {
  adminNotes: string | null;
  createdAt: string;
  customer: AdminQuotationCustomer;
  customerOfferAmount: number | string | null;
  id: string;
  notes: string | null;
  products: AdminQuotationProduct[];
  quoteAmount: number | string | null;
  responseNote: string | null;
  serviceIds: string[];
  serviceNames: string[];
  status: AdminQuotationStatus;
  updatedAt: string;
}

export interface AdminQuotationStats {
  accepted: number;
  negotiating: number;
  pending: number;
  responded: number;
  sent: number;
  total: number;
}

export interface AdminQuotationRequestsResponse {
  quotes: AdminQuotationRequest[];
  stats: AdminQuotationStats;
}

export interface AdminQuotationRequestsParams {
  limit?: number;
  search?: string;
  status?: AdminQuotationFilter;
}

export interface UpdateAdminQuotationRequestPayload {
  adminNotes?: string;
  customerOfferAmount?: number | null;
  id: string;
  quoteAmount?: number | null;
  responseNote?: string;
  status?: AdminQuotationStatus;
}

export interface EdgeFunctionRequest<TBody = unknown> {
  body?: TBody;
  functionName: string;
  headers?: Record<string, string>;
  method?: Method;
  params?: QueryParams;
}

interface EdgeFunctionError {
  data: unknown;
  status: number | string;
}

const edgeClient = axios.create({
  baseURL: supabaseConfig.functionsUrl,
  timeout: 30000
});

const getAuthHeaders = async (headers?: Record<string, string>) => {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return {
    Authorization: `Bearer ${session?.access_token ?? supabaseConfig.anonKey}`,
    apikey: supabaseConfig.anonKey,
    'Content-Type': 'application/json',
    ...headers
  };
};

const edgeFunctionsBaseQuery =
  (): BaseQueryFn<EdgeFunctionRequest, unknown, EdgeFunctionError> =>
  async ({ body, functionName, headers, method = 'POST', params }) => {
    try {
      const response = await edgeClient.request({
        data: body,
        headers: await getAuthHeaders(headers),
        method,
        params,
        url: functionName.replace(/^\/+/, '')
      });

      return { data: response.data };
    } catch (error) {
      const axiosError = error as AxiosError;

      return {
        error: {
          data: axiosError.response?.data ?? axiosError.message,
          status: axiosError.response?.status ?? 'FETCH_ERROR'
        }
      };
    }
  };

export const edgeFunctionsApi = createApi({
  baseQuery: edgeFunctionsBaseQuery(),
  endpoints: (builder) => ({
    getAdminQuotationRequests: builder.query<
      AdminQuotationRequestsResponse,
      AdminQuotationRequestsParams | void
    >({
      providesTags: ['AdminQuotationRequests'],
      query: (params) => ({
        functionName: 'admin-quotation-requests',
        method: 'GET',
        params: params ? { ...params } : undefined
      })
    }),
    updateAdminQuotationRequest: builder.mutation<
      AdminQuotationRequest,
      UpdateAdminQuotationRequestPayload
    >({
      invalidatesTags: ['AdminQuotationRequests', 'EdgeFunction'],
      query: (body) => ({
        body,
        functionName: 'admin-quotation-requests',
        method: 'PATCH'
      })
    }),
    fetchEdgeFunction: builder.query<unknown, EdgeFunctionRequest>({
      query: (request) => ({
        ...request,
        method: request.method ?? 'GET'
      })
    }),
    invokeEdgeFunction: builder.mutation<unknown, EdgeFunctionRequest>({
      query: (request) => request
    })
  }),
  reducerPath: 'edgeFunctionsApi',
  tagTypes: ['AdminQuotationRequests', 'EdgeFunction']
});

export const {
  useFetchEdgeFunctionQuery,
  useGetAdminQuotationRequestsQuery,
  useInvokeEdgeFunctionMutation,
  useUpdateAdminQuotationRequestMutation
} = edgeFunctionsApi;
