import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { v4 as uuidv4 } from 'uuid';
import { CustomerFiles, ProductImage } from './type';

//user table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // hashed
  token: text('token').unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const area = sqliteTable('area', {
  areaId: text('area_id').primaryKey().$defaultFn(() => uuidv4()),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});


// Address table
export const address = sqliteTable('address', {
  addressId: text('address_id').primaryKey().$defaultFn(() => uuidv4()),
  floor: text('floor'),
  plotNo: text('plot_no'),
  societyName: text('society_name'),
  lane: text('lane'),
  address: text('address'),
  area: text('area'),
  city: text('city'),
  state: text('state'),
  pincode: text('pincode'),
  locationLink: text('location_link'),
  addressType: text('address_type', { enum: ['Customer', 'Supplier'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Customer table
export const customer = sqliteTable('customer', {
  customerId: text('customer_id').primaryKey().$defaultFn(() => uuidv4()),
  addressId: text('address_id').notNull().references(() => address.addressId, { onDelete: 'cascade' }),
  areaId: text('area_id').references(() => area.areaId),
  companyName: text('company_name'),
  customerName: text('customer_name'),
  reference: text('reference'),
  mobileNo: text('mobile_no'),
  gstNo: text('gst_no'),
  workType: text('work_type', { mode: 'json' }).$type<string[]>(),
  machineType: text('machine_type', { mode: 'json' }).$type<{ label: string, value: string }[]>(),
  making: text('making', { mode: 'json' }).$type<string[]>(),
  materialUsage: text('material_usage', { mode: 'json' }).$type<string[]>(),
  type: text('type', { mode: 'json' }).$type<string[]>(),
  color: text('color', { mode: 'json' }).$type<string[]>(),
  subToneColor: text('sub_tone_color', { mode: 'json' }).$type<string[]>(),
  subMetallicColor: text('sub_metallic_color', { mode: 'json' }).$type<string[]>(),
  taste: text('taste', { mode: 'json' }).$type<string[]>(),
  size: text('size', { mode: 'json' }).$type<string[]>(),
  range: text('range'),
  usageValueMonthly: text('usage_value_monthly'),
  paymentCycle: text('payment_cycle'),
  openForCollab: text('open_for_collab'),
  customerSaleChoice: text('customer_sale_choice', { mode: 'json' }).$type<string[]>(),
  customerSaleMethod: text('customer_sale_method', { mode: 'json' }).$type<string[]>(),
  notes: text('notes'),
  files: text('files', { mode: 'json' }).$type<CustomerFiles[]>(),
  productImages: text('product_images', { mode: 'json' }).$type<CustomerFiles[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Supplier table
export const supplier = sqliteTable('supplier', {
  supplierId: text('supplier_id').primaryKey().$defaultFn(() => uuidv4()),
  addressId: text('address_id').notNull().references(() => address.addressId, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  supplierName: text('supplier_name'),
  mobileNo: text('mobile_no'),
  gstNo: text('gst_no'),
  workType: text('work_type', { mode: 'json' }).$type<string[]>(),
  productPattern: text('product_pattern', { mode: 'json' }).$type<string[]>(),
  supplierMachineType: text('supplier_machine_type', { mode: 'json' }).$type<string[]>(),
  mainCategory: text('main_category', { mode: 'json' }).$type<string[]>(),
  jariBase: text('jari_base', { mode: 'json' }).$type<string[]>(),
  cordingBase: text('cording_base', { mode: 'json' }).$type<string[]>(),
  type: text('type', { mode: 'json' }).$type<string[]>(),
  stock: text('stock', { mode: 'json' }).$type<string[]>(),
  productionCapacity: text('production_capacity', { mode: 'json' }).$type<string[]>(),
  supplierProductGallery: text('supplier_product_gallery', { mode: 'json' }),
  notes: text('notes'),
  files: text('files', { mode: 'json' }).$type<{ id: string, name: string, note: string }[]>(),
  images: text('images', { mode: 'json' }).$type<{ id: string, name: string, note: string }[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Orders table
export const orders = sqliteTable('orders', {
  orderId: text('order_id').primaryKey().$defaultFn(() => uuidv4()),
  customerId: text('customer_id').references(() => customer.customerId, { onDelete: 'set null' }),
  supplierId: text('supplier_id').references(() => supplier.supplierId, { onDelete: 'set null' }),
  images: text('images', { mode: 'json' }).$type<{ public_id: string, name: string, note: string }[]>(),
  productName: text('product_name'),
  type: text('type'),
  sample: text('sample'),
  stage: text('stage'),
  description: text('description'),
  targetDate: integer('target_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Product table
export const product = sqliteTable('product', {
  productId: text('product_id').primaryKey().$defaultFn(() => uuidv4()),
  supplierId: text('supplier_id').notNull().references(() => supplier.supplierId, { onDelete: 'cascade' }),
  productName: text('product_name'),
  vnuProductName: text('vnu_product_name'),
  moq: text('moq'),
  productPattern: text('product_pattern', { mode: 'json' }).$type<string[]>(),
  mainCategory: text('main_category', { mode: 'json' }).$type<string[]>(),
  type: text('type', { mode: 'json' }).$type<string>(),
  color: text('color', { mode: 'json' }).$type<string>(),
  subMetallicColor: text('sub_metallic_color', { mode: 'json' }).$type<string>(),
  subToneColor: text('sub_tone_color', { mode: 'json' }).$type<string>(),
  size: text('size').$type<string>(),
  purchaseRate: text('purchase_rate').$type<string>(),
  salesRate: text('sales_rate').$type<string>(),
  jariBase: text('jari_base', { mode: 'json' }).$type<string[]>(),
  images: text('images', { mode: 'json' }).$type<ProductImage[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});


// Relations
// address table
export const addressRelations = relations(address, ({ many }) => ({
  customers: many(customer),
  suppliers: many(supplier),
}));

// customer table
export const customerRelations = relations(customer, ({ one, many }) => ({
  //  customer - address (FK: addressId)
  address: one(address, {
    fields: [customer.addressId],       // FK in customer table
    references: [address.addressId],    // PK in address table
  }),
  // customer -> many orders
  orders: many(orders),
}));

// supplier table
export const supplierRelations = relations(supplier, ({ one, many }) => ({
  // supplier -> address (foreign key: addressId)
  address: one(address, {
    fields: [supplier.addressId],       // FK in supplier table
    references: [address.addressId],    // PK in address table
  }),
  //supplier -> many orders
  orders: many(orders),
  products: many(product)
}));

// orders
export const ordersRelations = relations(orders, ({ one }) => ({

  customer: one(customer, {
    fields: [orders.customerId],        // FK in orders table
    references: [customer.customerId],  // PK in customer table
  }),

  supplier: one(supplier, {
    fields: [orders.supplierId],        // FK in orders table
    references: [supplier.supplierId],  // PK in supplier table
  }),
}));

export const productRelations = relations(product, ({ one }) => ({
  supplier: one(supplier, {
    fields: [product.supplierId],
    references: [supplier.supplierId],
  }),
}));
