import { Product } from '@/db/type';
import { z } from 'zod';
import { ProductImage as BaseProductImage } from "@/db/type";

export const ProductInsertSchema = z.object({
  supplierId: z.string().min(1, "Please select a supplier"),
  vnuProductName: z.string().optional().default(""),
  productName: z.string(),
  moq: z.string(),
  productPattern: z.array(z.string()),
  mainCategory: z.array(z.string()),
  type: z.string().optional().default(""),
  color: z.string().optional().default(""),
  subToneColor: z.string().optional().default(""),
  subMetallicColor: z.string().optional().default(""), 
  size: z.string().optional().default(""),
  salesRate: z.string().optional().default(""),
  purchaseRate: z.string().optional().default(""),
  jariBase: z.array(z.string()),
  images: z.array(z.object({
    public_id: z.string(),
    name: z.string()
  })).optional().default([]),
});


export const ProductUpdateSchema = ProductInsertSchema; // same structure for now

// filters schema
export const getAllSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  filters: z.object({
    mainCategory: z.string().optional(),
    // Add more filters here if needed
  }).optional(),
});



export type ProductImage = BaseProductImage & {
  signedUrl?: string; 
};


export type GetAllProductsResponse = {
  data: Product[];
  total: number;
  limit: number;
  offset: number;
};


const FileSchema = z.instanceof(File);

const splitToArray = (value?: string | string[]): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => v.trim()).filter(Boolean);
  return value.split(',').map(v => v.trim()).filter(Boolean);
};


// Schema for creating a new product
export const CreateProductRequest = z.object({
  supplierId: z.string(),
  productName: z.string().nullable().optional(),
  vnuProductName: z.string().nullable().optional(),
  moq: z.string().nullable().optional(),
  productPattern: z.string().optional().transform(splitToArray),
  mainCategory: z.string().optional().transform(splitToArray),
  type: z.string().optional().nullable(),
  color: z.string().optional().optional(),
  subToneColor: z.string().optional(),
  subMetallicColor: z.string().optional(),
  purchaseRate: z.string().optional(),
  salesRate: z.string().optional(),
  size: z.string().optional(),
  jariBase: z.string().optional().transform(splitToArray),
  'images[]': z.array(z.instanceof(File)).optional(),
});

export type CreateProductRequestType = z.infer<typeof CreateProductRequest>;

// Schema for updating a product
export const UpdateProductRequest = CreateProductRequest.extend({
  productId: z.string(),
  existingImages:z.string().optional().transform(splitToArray),
  'newImages[]': z.union([FileSchema, z.array(FileSchema)]).optional(),
});

export type UpdateProductRequestType = z.infer<typeof UpdateProductRequest>;

// Schema for deleting or getting a product by ID
export const DeleteProductRequest = z.object({
  id: z.string(),
});

export type DeleteProductRequestType = z.infer<typeof DeleteProductRequest>;

export const GetProductRequest = DeleteProductRequest;

export type GetProductRequestType = z.infer<typeof GetProductRequest>;

// Schema for filters in get-all products

export const FiltersSchema = z.object({
  productName: z.array(z.string()).optional(),
  supplierId: z.string().optional(),
  moq: z.array(z.string()).optional(),
  productPattern: z.array(z.string()).optional(),
  mainCategory: z.array(z.string()).optional(),
  type: z.array(z.string()).optional(),
  color: z.array(z.string()).optional(),
  subMetallicColor: z.array(z.string()).optional(), 
  subToneColor: z.array(z.string()).optional(),
  size: z.array(z.string()).optional(),
  jariBase: z.array(z.string()).optional(),
  cordingBase: z.array(z.string()).optional(),
});

export type FiltersType = z.infer<typeof FiltersSchema>;

// Schema for getting all products with pagination and filtering
export const GetAllProductsRequest = z.object({
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  filters: FiltersSchema,
  search: z.string().optional(),
});

export type GetAllProductsRequestType = z.infer<typeof GetAllProductsRequest>;