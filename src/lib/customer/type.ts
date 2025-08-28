import { Address } from "@/db";
import { z } from "zod";

const FileSchema = z.instanceof(File).optional();

const splitToArray = (value?: string): string[] => {
  if (!value) return [];
  return value.split(',').map(v => v.trim()).filter(Boolean);
};

const KeyValueSchema = z.object({
  label: z.string(),
  value: z.string(),
});


export const CreateCustomerRequest = z.object({
  // Address fields
  floor: z.string().nullable().optional(),
  plotNo: z.string().nullable().optional(),
  societyName: z.string().nullable().optional(),
  lane: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),
  locationLink: z.string().url().nullable().optional(),

  // Image uploads
  "productImages[]": z.union([FileSchema, z.array(FileSchema)]).optional(),
  productImageNotes: z.string().optional().transform(splitToArray),

  // PDF uploads
  "files[]": z.union([FileSchema, z.array(FileSchema)]).optional(),
  fileNotes: z.string().optional().transform(splitToArray),

  // Customer fields
  companyName: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  mobileNo: z.string().nullable().optional(),
  gstNo: z.string().nullable().optional(),
  range: z.string().nullable().optional(),
  usageValueMonthly: z.string().nullable().optional(),
  paymentCycle: z.string().nullable().optional(),
  openForCollab: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),

  // array fields
  size: z.string().optional().transform(splitToArray),
  materialUsage: z.string().optional().transform(splitToArray),
  workType: z.string().optional().transform(splitToArray),
  subMetallicColor: z.string().optional().transform(splitToArray),
  making: z.string().optional().transform(splitToArray),
  type: z.string().optional().transform(splitToArray),
  color: z.string().optional().transform(splitToArray),
  subToneColor: z.string().optional().transform(splitToArray),
  taste: z.string().optional().transform(splitToArray),
  customerSaleChoice: z.string().optional().transform(splitToArray),
  customerSaleMethod: z.string().optional().transform(splitToArray),
  machineType: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val); // Turns it into an actual array of objects
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(KeyValueSchema).optional()),


});

export type CreateCustomerRequestType = z.infer<typeof CreateCustomerRequest>;

export const UpdateCustomerRequest = CreateCustomerRequest.extend({
  customerId: z.string(),
  existingProductImages: z.string().optional().transform(splitToArray),
  existingFiles: z.string().optional().transform(splitToArray),
});


export type UpdateCustomerRequestType = z.infer<typeof UpdateCustomerRequest>;

export const DeleteCustomerRequest = z.object({
  id: z.string(),
});

export type DeleteCustomerRequestType = z.infer<typeof DeleteCustomerRequest>;

export const GetCustomerRequest = DeleteCustomerRequest;

export type GetCustomerRequestType = z.infer<typeof GetCustomerRequest>;


export const FiltersSchema = z.object({
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

export type FiltersType = z.infer<typeof FiltersSchema>;

export const GetAllCustomersRequest = z.object({
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  filters: FiltersSchema,
  search: z.string().optional(),
});

export type GetAllCustomersRequestType = z.infer<typeof GetAllCustomersRequest>;

type images = {
  public_id: string;
  name: string;
  signedUrl: string;
  note?: string;
};

type files = {
  public_id: string;
  signedUrl: string;
  name?: string;
}

export type Customer = {
  customerId: string;
  addressId: string;
  companyName: string | null;
  customerName: string | null;
  reference: string | null;
  mobileNo: string | null;
  gstNo: string | null;
  workType: string[] | null;
  machineType: Array<{ label: string; value: string }> | null;
  making: string[] | null;
  materialUsage: string[] | null;
  type: string[] | null;
  color: string[] | null;
  subToneColor: string[] | null;
  subMetallicColor: string[] | null;
  taste: string[] | null;
  size: string[] | null;
  range: string | null;
  usageValueMonthly: string | null;
  paymentCycle: string | null;
  openForCollab: string | null;
  customerSaleChoice: string[] | null;
  customerSaleMethod: string[] | null;
  notes: string | null;
  files: files[] | null;
  productImages: images[] | null;
  createdAt: Date;
  updatedAt: Date;
  address: Address;
}

export interface GetAllCustomersResponse {
  data: Customer[];
  total: number;
  limit: number;
  offset: number;
}

export type area = {
  id: string;
  name: string;
}

export type GellAllAreaResponse = {
  data: area[];
}

export type IdNameResponse = {
  id : string;
  companyName: string;
}

export type GetAllCustomerCompanyNameResponse = IdNameResponse[];

