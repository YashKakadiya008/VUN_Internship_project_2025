import z from "zod";

export const DownloadExcelRequest = z.object({});
export type DownloadExcelRequest = z.infer<typeof DownloadExcelRequest>;

export const OrderReportByCustomerRequest = DownloadExcelRequest.extend({
  customerId: z.string().uuid(),
});

export const OrderReportBySupplierRequest = DownloadExcelRequest.extend({
  supplierId: z.string().uuid(),
});

export type OrderReportByCustomerRequest = z.infer<typeof OrderReportByCustomerRequest>;
export type OrderReportBySupplierRequest = z.infer<typeof OrderReportBySupplierRequest>;

export const SupplierFiltersSchema = z.object({
  workType: z.array(z.string()).optional(),
  productPattern: z.array(z.string()).optional(),
  supplierMachineType: z.array(z.string()).optional(),
  mainCategory: z.array(z.string()).optional(),
  jariBase: z.array(z.string()).optional(),
  cordingBase: z.array(z.string()).optional(),
  type: z.array(z.string()).optional(),
  stock: z.array(z.string()).optional(),
  productionCapacity: z.array(z.string()).optional(),
}).strict().optional();

export const CustomerFiltersSchema = z.object({
  workType: z.array(z.string()).optional(),
  machineType: z.array(z.string()).optional(),
  making: z.array(z.string()).optional(),
  materialUsage: z.array(z.string()).optional(),
  type: z.array(z.string()).optional(),
  color: z.array(z.string()).optional(),
  subToneColor: z.array(z.string()).optional(),
  taste: z.array(z.string()).optional(),
  customerSaleChoice: z.array(z.string()).optional(),
  customerSaleMethod: z.array(z.string()).optional(),
  subMetallicColor: z.array(z.string()).optional(),
  Size: z.array(z.string()).optional(),
  range: z.array(z.string()).optional(),
  usageValueMonthly: z.array(z.string()).optional(),
  paymentCycle: z.array(z.string()).optional(),
  stage: z.string().optional(),
  area: z.string().optional(),
}).optional();

export type CustomerExcelRequestWithFilters = z.infer<typeof CustomerFiltersSchema>

export type SupplierExcelRequestWithFilters = z.infer<typeof SupplierFiltersSchema>

export const OrderIdListRequest = z.object({
  orderIds: z.array(z.string()).optional(),
});

export type OrderIdListRequest = z.infer<typeof OrderIdListRequest>;


export const salesFilterSchema = z.object({
  type: z.enum(["customer", "supplier"]).optional(),
  id: z.string().array().optional(),
  orderType: z.enum(["Order", "Sample"]).optional(),
  stage: z.enum(["Development", "Delivery", "Completed"]).optional(),
  from: z.number().int().optional(),
  to: z.number().int().optional(),
})

export const salesPaginationSchame = z.object({
  page: z.number().default(1).optional(),
  limit: z.number().default(15).optional(),
  filter: salesFilterSchema,
  search: z.string().optional(),
}).strict();

export type SalesPaginationRequest = z.infer<typeof salesPaginationSchame>;
export type SalesFilterRequest = z.infer<typeof salesFilterSchema>;

export type Address = {
  addressId: string;
  floor: string | null;
  plotNo: string | null;
  societyName: string | null;
  lane: string | null;
  address: string | null;
  area: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  locationLink: string | null;
  addressType: 'Customer' | 'Supplier';
};


type SalesWithAddresses = {
  orderId: string;
  stage: string | null;
  ordertype: string | null;
  productName: string | null;
  targetDate: string;
  description: string | null;

  customerId: string | null;
  customerName: string | null;
  customerCompany: string | null;
  customerMobile: string | null;
  customerAddressId: string | null;
  orderType: string | null;
  orderStage: string | null;

  supplierId: string | null;
  supplierName: string | null;
  supplierCompany: string | null;
  supplierMobile: string | null;
  supplierAddressId: string | null;

  customerAddress: Address | null;
  supplierAddress: Address | null;
};

type PaginatedSalesResponse = {
  data: SalesWithAddresses[];
  metadata: {
    total: number;
    limit: number;
    page: number;
  }
};

export type SalesByPaginationResponse = PaginatedSalesResponse;


