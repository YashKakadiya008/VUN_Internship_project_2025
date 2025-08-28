import { z } from "zod";

export const addProductSchema = z.object({
    product: z.string().min(1, "Product name is required"),
    vnuProductName: z.string().optional(),
    supplierId: z.string().min(1, "Please select a supplier"),
    moq: z.string().min(1, "MOQ is required"),
    purchaseRate: z.string().optional(),
    salesRate: z.string().optional(),
    productPattern: z.array(z.string()).optional(),
    mainCategory: z.array(z.string()).optional(),
    type: z.string().optional(),             
    color: z.string().optional(),        
    subMetalicColor: z.string().optional(),   
    subToneColor: z.string().optional(), 
    size: z.string().optional(),            
    jariBase: z.array(z.string()).optional(),
});

export type AddProductField = z.infer<typeof addProductSchema>

export const addImageSchema = z.object({
    id: z.string().optional(),
    note: z.string().optional(),
})

export type AddImageField = z.infer<typeof addImageSchema>

export type ProductImage = {
  public_id: string;
  name: string;
  signedUrl: string;
}


export type ProductData = {
  supplierId: string;
  productId: string;
  productName: string | null;
  vnuProductName: string | null;
  moq: string | null;
  productPattern: string[] | undefined;
  mainCategory: string[] | undefined;
  type: string | undefined;
  color: string | undefined;
  subMetallicColor: string | undefined; // Keep consistent spelling
  subToneColor: string | undefined; // This matches the backend field name
  size: string | undefined;
  jariBase: string[] | undefined;
  purchaseRate: string | null;
  salesRate: string | null;
  images: ProductImage[] | undefined;
  createdAt: Date;
  updatedAt: Date;
};