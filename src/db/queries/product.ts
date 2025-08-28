import { db } from '@/db';
import { product } from '@/db/schema';
import { FiltersType } from '@/lib/product/type';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { ProductInsert, ProductUpdate } from '../type';

export async function createProduct(data: ProductInsert) {

  const [p] = await db.insert(product).values(data).returning();
  return p;
}

export async function updateProduct(id: string, data: ProductUpdate) {
  const [p] = await db.update(product).set(data).where(eq(product.productId, id)).returning();
  return p;
}

export async function getProductById(id: string) {
  const [p] = await db.select().from(product).where(eq(product.productId, id)).limit(1);
  return p;
}

export async function deleteProduct(id: string) {
  const [p] = await db.delete(product).where(eq(product.productId, id)).returning();
  return p;
}

/**
 * Get paginated and filtered products.
 * 
 * @param limit - Max items to return (default 10)
 * @param offset - How many items to skip (for pagination)
 * @param filters - Filter products by fields (e.g. mainCategory)
 * 
 * @returns {
 *   data: matched products,
 *   total: total matched count (without pagination),
 *   limit: items per page,
 *   offset: skipped items
 * }
 * 
 * Example:
 *   limit: 10, offset: 20 → returns products 21–30
 */

export async function getAllProducts({
  limit = 10,
  offset = 0,
  filters = {},
  search,
}: {
  limit?: number;
  offset?: number;
  filters?: FiltersType;
  search?: string;
}) {
  const conditions = [];

  const matchArrayField = (field: typeof product[keyof typeof product], filterValues?: string[]) => {
    if (filterValues && filterValues.length > 0) {
      try {
        // Handle single-value JSON fields (e.g., color, type, subMetallicColor, subToneColor)
        if (
          field === product.color ||
          field === product.type ||
          field === product.subMetallicColor ||
          field === product.subToneColor
        ) {
          conditions.push(
            sql`json_extract(${field}, '$') IN (${sql.join(filterValues.map(value => sql`${value}`), sql`, `)})`
          );
        } else {
          // Handle array-based JSON fields (e.g., productPattern, mainCategory, jariBase, cordingBase)
          conditions.push(
            sql`EXISTS (
              SELECT 1
              FROM json_each(${field}) AS item
              WHERE item.value IN (${sql.join(filterValues.map(value => sql`${value}`), sql`, `)})
            )`
          );
        }
      } catch (err) {
        console.error(`Error processing filter for field ${field}:`, err);
        throw new Error(`Invalid filter values for ${field}`);
      }
    }
  };

  if (filters.productName) {
    conditions.push(
      sql`LOWER(${product.productName}) IN (${sql.join(filters.productName.map(name => sql`${name.toLowerCase()}`), sql`, `)})`
    );
  }

  if (filters.moq) {
    conditions.push(
      sql`${product.moq} IN (${sql.join(filters.moq.map(value => sql`${value}`), sql`, `)})`
    );
  }

  if (filters.size) {
    conditions.push(
      sql`${product.size} IN (${sql.join(filters.size.map(value => sql`${value}`), sql`, `)})`
    );
  }

  if (filters.supplierId) {
    conditions.push(eq(product.supplierId, filters.supplierId));
  }

  matchArrayField(product.productPattern, filters.productPattern);
  matchArrayField(product.mainCategory, filters.mainCategory);
  matchArrayField(product.type, filters.type);
  matchArrayField(product.color, filters.color);
  matchArrayField(product.subMetallicColor, filters.subMetallicColor);
  matchArrayField(product.subToneColor, filters.subToneColor);
  matchArrayField(product.jariBase, filters.jariBase);

  let searchCondition;

  if (search) {
    const searchPattern = `%${search.toLowerCase()}%`;
  
    const productNameSearch = sql`LOWER(${product.productName}) LIKE ${searchPattern}`;
  
    searchCondition = or(productNameSearch);
  }

  if (searchCondition) {
    conditions.push(searchCondition);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const dataQuery = db
    .select()
    .from(product)
    .where(whereClause)
    .limit(limit)
    .orderBy(desc(product.createdAt))
    .offset(offset);

  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(product)
    .where(whereClause);


  try {
    const [data, countResult] = await Promise.all([dataQuery, countQuery]);
    
    const total = countResult[0]?.count ?? 0;

    return {
      data,
      total,
      limit,
      offset,
    };
  } catch (err) {
    console.error('Query execution error:', err);
    throw err;
  }
}


