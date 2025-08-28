import * as schema from './schema';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { ExtractTablesWithRelations } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import env from '@/env';

// Create the LibSQL client
export const client = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

// Initialize Drizzle
export const db = drizzle(client, { schema });

export type DBType = LibSQLDatabase<typeof schema> & {
  $client: ReturnType<typeof createClient>;
};

export function getDB(tx?: TransactionType): DBType | TransactionType {
  return tx || db;
}

export type SchemaType = typeof schema;

export type TransactionType = SQLiteTransaction<
  'async',
  Record<string, never>,
  SchemaType,
  ExtractTablesWithRelations<SchemaType>
>;

// Types derived from schema
export type Address = typeof schema.address.$inferSelect;
export type AddressInsert = typeof schema.address.$inferInsert;
export type Customer = typeof schema.customer.$inferSelect;
export type CustomerInsert = typeof schema.customer.$inferInsert;

// Cloudinary file type
export interface CloudinaryFile {
  public_id: string;
  path: string;
  name?: string;
}

// Export types for each table
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;


export type Supplier = typeof schema.supplier.$inferSelect;
export type SupplierInsert = typeof schema.supplier.$inferInsert;



export type Orders = typeof schema.orders.$inferSelect;
export type NewOrders = typeof schema.orders.$inferInsert;

export type Product = typeof schema.product.$inferSelect;
export type NewProduct = typeof schema.product.$inferInsert;
