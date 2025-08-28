import { z } from 'zod';
import { customer, orders, product, supplier } from './schema';

export type ProductImage = {
  public_id: string;
  name: string;
};

export type CustomerFiles = {
  public_id: string;
  name: string;
  note: string;
};

export type CustomerFilter = {
  workType?: string[];
  machineType?: string[];
  making?: string[];
  materialUsage?: string[];
  type?: string[];
  color?: string[];
  subToneColor?: string[];
  subMetallicColor?: string[];
  taste?: string[];
  size?: string[];
  range?: string[];
  usageValueMonthly?: string[];
  paymentCycle?: string[];
  customerSaleChoice?: string[];
  customerSaleMethod?: string[];
  stage?: string;
  area?: string;
};

export type Product = {
  supplierId: string;
  productId: string;
  productName: string | null;
  vnuProductName: string | null;
  moq: string | null;
  productPattern: string[] | undefined;
  mainCategory: string[] | undefined;
  type: string | undefined;
  color: string | undefined;
  subMetallicColor: string | undefined;
  subToneColor: string | undefined;
  size: string | undefined;
  jariBase: string[] | undefined;
  purchaseRate: string | null;
  salesRate: string | null;
  images: ProductImage[] | undefined;
  createdAt: Date;
  updatedAt: Date;
};

export const ProductInsertSchema = z.object({
  productName: z.string(),
  moq: z.string(),
  mainCategory: z.array(z.string()),
  size: z.array(z.string()),
  productPattern: z.array(z.string()),
  type: z.string(),
  color: z.array(z.string()),
  subToneColor: z.array(z.string()),
  jariBase: z.array(z.string()),
  cordingBase: z.array(z.string()),
  images: z.array(z.object({
    public_id: z.string(),
    name: z.string(),
  })),
});



export const ProductUpdateSchema = ProductInsertSchema.partial();

export const ProductFilterSchema = z.object({
  filters: z.object({
    type: z.array(z.string()).optional(),
    color: z.array(z.string()).optional(),
    cordingBase: z.array(z.string()).optional(),
    mainCategory: z.array(z.string()).optional(),
    subToneColor: z.array(z.string()).optional(),
  }).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type SupplierFilter = {
  stock?: string[];
  cordingBase?: string[];
  mainCategory?: string[];
  type?: string[];
  productionCapacity?: string[];
  supplierMachineType?: string[];
  productPattern?: string[];
};

export type OrderFilter = {
  customerId?: string;
  supplierId?: string;
  stage?: string[];
  type?: string[];
  productName?: string;
  fromDate?: Date;
  toDate?: Date;
};

// Customer type based on the schema
export type CustomerInsert = Omit<typeof customer.$inferInsert, 'createdAt' | 'updatedAt'>;
export type CustomerUpdate = Partial<CustomerInsert>;


export type ProductInsert = typeof product.$inferInsert;
export type ProductUpdate = Partial<typeof product.$inferInsert>;
export type ProductFilter = z.infer<typeof ProductFilterSchema>['filters'];


export type SupplierInsert = typeof supplier.$inferInsert;
export type SupplierUpdate = Partial<typeof supplier.$inferInsert>;

export type OrderAdd = {
  orderId: string;
  customerId: string;
  supplierId: string;
  images?: ProductImage[];
  productName?: string | null;
  type?: string | null;
  sample?: string | null;
  stage?: string | null;
  description?: string | null;
  targetDate?: string | null | undefined;
}

export type OrderInsert = typeof orders.$inferInsert;

export type OrderUpdate = Partial<typeof orders.$inferInsert>;