import { z } from "zod";

const FileSchema = z.instanceof(File).optional();

const splitToArray = (value?: string): string[] => {
  if (!value) return [];
  return value.split(',').map(v => v.trim()).filter(Boolean);
};

export const CreateSupplierRequest = z.object({
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
  "images[]": z.union([FileSchema, z.array(FileSchema)]).optional(),
  imageNotes: z.string().optional().transform(splitToArray),

  // PDF uploads
  "files[]": z.union([FileSchema, z.array(FileSchema)]).optional(),
  fileNotes: z.string().optional().transform(splitToArray),

  // Supplier fields
  companyName: z.string().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  mobileNo: z.string().nullable().optional(),
  gstNo: z.string().nullable().optional(),
  workType: z.string().optional().transform(splitToArray),
  productPattern: z.string().optional().transform(splitToArray),
  supplierMachineType: z.string().optional().transform(splitToArray),
  mainCategory: z.string().optional().transform(splitToArray),
  jariBase: z.string().optional().transform(splitToArray),
  cordingBase: z.string().optional().transform(splitToArray),
  type: z.string().optional().transform(splitToArray),
  stock: z.string().optional().transform(splitToArray),
  productionCapacity: z.string().optional().transform(splitToArray),
  notes: z.string().nullable().optional(),
  supplierProductGallery: z.string().optional().transform((val) => val ? JSON.parse(val) : undefined),
});

export type CreateSupplierRequestType = z.infer<typeof CreateSupplierRequest>;

// Extend for update
export const UpdateSupplierRequest = CreateSupplierRequest.extend({
  existingImages: z.string().optional().transform(splitToArray),
  existingFiles: z.string().optional().transform(splitToArray),
});

export type UpdateSupplierRequestType = z.infer<typeof UpdateSupplierRequest>;



export const DeleteSupplierRequest = z.object({
  id: z.string(),
});

export type DeleteSupplierRequestType = z.infer<typeof DeleteSupplierRequest>;

export const GetSupplierRequest = DeleteSupplierRequest;

export type GetSupplierRequestType = z.infer<typeof GetSupplierRequest>;

export const FiltersSchema = z.object({
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

export type FiltersType = z.infer<typeof FiltersSchema>;

export const GetAllSuppliersRequest = z.object({
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  filters: FiltersSchema,
  search: z.string().optional(),
}).strict();

export type GetAllSuppliersRequestType = z.infer<typeof GetAllSuppliersRequest>;


export type SupplierUpdateData = {
  companyName?: string;
  supplierName?: string;
  mobileNo?: string;
  gstNo?: string;
  floor?: string;
  plotNo?: string;
  societyName?: string;
  lane?: string;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  locationLink?: string;
  workType?: string;
  productPattern?: string[];
  supplierMachineType?: string[];
  mainCategory?: string[];
  jariBase?: string[];
  cordingBase?: string[];
  type?: string[];
  stock?: string[];
  productionCapacity?: string[];
  notes?: string;

  existingImages?: string[];
  existingFiles?: string[];

  'images[]'?: File[];
  imageNotes?: string[];

  'files[]'?: File[];
  fileNotes?: string[];
}

