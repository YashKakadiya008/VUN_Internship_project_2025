import { z } from "zod";

const FileSchema = z.instanceof(File).optional();

const splitToArray = (value?: string): string[] => {
  if (!value) return [];
  return value.split(',').map((v) => v.trim()).filter(Boolean);
};

export const CreateOrderRequest = z.object({
  customerId: z.string(),
  supplierId: z.string(),
  'images[]': z.union([FileSchema, z.array(FileSchema)]).optional(),
  productName: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  sample: z.string().nullable().optional(),
  stage: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
});

export type CreateOrderRequestType = z.infer<typeof CreateOrderRequest>;

export const UpdateOrderRequest = CreateOrderRequest.extend({
  orderId: z.string(),
  existingImages: z.string().optional().transform(splitToArray),
});

export type UpdateOrderRequestType = z.infer<typeof UpdateOrderRequest>;

export const DeleteOrderRequest = z.object({
  id: z.string(),
});

export type DeleteOrderRequestType = z.infer<typeof DeleteOrderRequest>;

export const GetOrderRequest = DeleteOrderRequest;
export type GetOrderRequestType = z.infer<typeof GetOrderRequest>;

export const OrderFiltersSchema = z.object({
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  stage: z.array(z.string()).optional(),
  type: z.array(z.string()).optional(),
  productName: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
}).optional();

export type OrderFiltersType = z.infer<typeof OrderFiltersSchema>;

export const GetAllOrdersRequest = z.object({
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  filters: OrderFiltersSchema,
});

export type GetAllOrdersRequestType = z.infer<typeof GetAllOrdersRequest>;


export type IdNameResponse = {
  id : string;
  name: string;
  companyName: string;
}

export type GetAllIdNameResponse = IdNameResponse[];


export type OrderWithCustomerAndAddress = {
  orderId: string;
  customerId: string | null;
  supplierId: string | null;
  images: { public_id: string; name: string , signedUrl: string }[] | null;
  productName: string | null;
  type: string | null;
  sample: string | null;
  stage: string | null;
  description: string | null;
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    customerId: string | null;
    companyName: string | null;
    mobileNo: string | null;
    addressId: string | null;
    address: {
      city: string | null;
      state: string | null;
      area: string | null;
    } | null;
  } | null;
};
