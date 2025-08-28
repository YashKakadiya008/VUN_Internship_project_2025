import { CustomerFilter, SupplierFilter } from "@/db/type";
import {
  DownloadExcelRequest,
  SalesByPaginationResponse,
  SalesFilterRequest,
  SalesPaginationRequest
} from "@/lib/report/type";
import { ApiPost } from "./api-helper";
import { GetAllIdNameResponse } from "@/lib/order/type";

export interface ReportResponse {
  data?: Blob;
  message?: string;
  success: boolean;
}

// get all customers id and name with search
export const getAllCustomersIdAndNameSearch = async (search: string) => {
  return ApiPost<GetAllIdNameResponse>(`/customer/get-all-customer-name`, { search }, {}, true);
}

// get all suppliers id and name with search
export const getAllSuppliersIdAndNameSearch = async (search: string) => {
  return ApiPost<GetAllIdNameResponse>(`/supplier/get-all-supplier-name`, { search }, {}, true);
}

// get-all sales with filter
export const getAllSalesData = async (data: SalesPaginationRequest) => {
  
  return ApiPost<SalesByPaginationResponse>(`/report/sale/get-all`, data, {}, true);
}

// generate sales report with filter
export const generateSalesReportWithFilter = async (data: SalesFilterRequest) => {
  return ApiPost<Blob>(`/report/sale/generate-report`, data, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json',
    },
  }, true);
}

export const generateCustomersReport = async (data: CustomerFilter) => {
  return ApiPost<Blob>(
    '/report/generate-customers-report',
    data,
    {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true
  );
};

export const generateCustomerReport = async (customerId: string, data: DownloadExcelRequest): Promise<ReportResponse> => {
  try {
    const response = await ApiPost<Blob | { message: string }>(
      `/report/generate-customer-report/${customerId}`,
      { data },
      {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      true
    );

    if (response instanceof Blob) {
      return { data: response, success: true };
    }

    return { message: (response as { message: string })?.message || 'No data found', success: false };
  } catch (error) {
    console.error('Error generating customer report:', error);
    return {
      success: false
    };
  }
};

export const generateSuppliersReport = async (data: SupplierFilter) => {
  return ApiPost<Blob>(
    '/report/generate-suppliers-report',
    data,
    {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true
  );
};

export const generateSalesReport = async () => {
  return ApiPost<Blob>(
    '/report/generate-sales-report',
    {},
    {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true
  );
};

// Helper function to handle file download
export const generateOrderReportByOrderId = async (orderId: string[], customerId: string) => {
  return ApiPost<Blob>(
    `/report/generate-order-report/customer/${customerId}`,
    { orderIds: orderId },
    {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true
  );
};

export const generateOrderReportBySupplier = async (orderId: string[], supplierId: string) => {
  return ApiPost<Blob>(
    `/report/generate-order-report/supplier/${supplierId}`,
    { orderIds: orderId },
    {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true
  );
};

// Helper function to handle file download
export const downloadReport = (data: Blob, filename: string) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};