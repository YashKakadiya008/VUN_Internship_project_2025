import { db } from '@/db';
import { address, customer, orders, supplier } from '@/db/schema';
import { SalesFilterRequest } from '@/lib/report/type';
import { and, desc, eq, inArray, or, sql, SQL } from 'drizzle-orm';
import { OrderFilter, OrderInsert, OrderUpdate } from '../type';

// CREATE
export async function createOrder(data: OrderInsert) {
  const [o] = await db.insert(orders).values(data).returning();
  return o;
}

// UPDATE
export async function updateOrder(id: string, data: OrderUpdate) {
  const [o] = await db.update(orders).set(data).where(eq(orders.orderId, id)).returning();
  return o;
}

// GET BY ID
export async function getOrderById(id: string) {
  const [o] = await db.select().from(orders).where(eq(orders.orderId, id)).limit(1);
  return o;
}

// DELETE
export async function deleteOrder(id: string) {
  const [o] = await db.delete(orders).where(eq(orders.orderId, id)).returning();
  return o;
}

export async function getAllOrders({
  limit = 10,
  offset = 0,
  filters = {},
  search,
}: {
  limit?: number;
  offset?: number;
  filters?: OrderFilter;
  search?: string;
}) {
  const conditions = [];

  if (filters.customerId) {
    conditions.push(eq(orders.customerId, filters.customerId));
  }

  if (filters.supplierId) {
    conditions.push(eq(orders.supplierId, filters.supplierId));
  }

  if (filters.stage && filters.stage.length > 0) {
    conditions.push(
      sql`${orders.stage} IN (${sql.join(filters.stage.map(v => sql`${v}`), sql`,`)})`
    );
  }

  if (filters.type && filters.type.length > 0) {
    conditions.push(
      sql`${orders.type} IN (${sql.join(filters.type.map(v => sql`${v}`), sql`,`)})`
    );
  }

  if (filters.productName) {
    const name = filters.productName.toLowerCase();
    conditions.push(sql`LOWER(${orders.productName}) LIKE ${'%' + name + '%'}`);
  }

  if (filters.fromDate && filters.toDate) {
    conditions.push(sql`${orders.targetDate} BETWEEN ${filters.fromDate} AND ${filters.toDate}`);
  } else if (filters.fromDate) {
    conditions.push(sql`${orders.targetDate} >= ${filters.fromDate}`);
  } else if (filters.toDate) {
    conditions.push(sql`${orders.targetDate} <= ${filters.toDate}`);
  }

  let searchCondition;

  if (search) {
    const searchPattern = `%${search.toLowerCase()}%`;
  
    const productNameSearch = sql`LOWER(${orders.productName}) LIKE ${searchPattern}`;
    const orderIdSearch = sql`LOWER(${orders.orderId}) LIKE ${searchPattern}`;
  
    searchCondition = or(productNameSearch, orderIdSearch);
  }

  if (searchCondition) {
    conditions.push(searchCondition);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const dataQuery = db
    .select()
    .from(orders)
    .where(whereClause)
    .limit(limit)
    .orderBy(desc(orders.createdAt))
    .offset(offset);

  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(whereClause);

  const [data, countResult] = await Promise.all([dataQuery, countQuery]);
  const total = countResult[0]?.count ?? 0;

  return {
    data,
    total,
    limit,
    offset,
  };
}

// get all order by customer ID
export async function getAllOrdersByCustomerId(customerId: string) {
  const data = await db.select().from(orders).where(eq(orders.customerId, customerId));
  return data;
}

// get all order by supplier ID
export async function getAllOrdersBySupplierId(supplierId: string) {
  const orderList = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .where(eq(orders.supplierId, supplierId));

  const enrichedOrders = await Promise.all(
    orderList.map(async (order) => {
      let customerData = null;

      if (order.customerId) {
        // Fetch customer
        const [customerRow] = await db
          .select({
            customerId: customer.customerId,
            companyName: customer.companyName,
            mobileNo: customer.mobileNo,
            addressId: customer.addressId,
          })
          .from(customer)
          .where(eq(customer.customerId, order.customerId));

        if (customerRow) {
          // Fetch customer's address
          const [addressRow] = await db
            .select({
              city: address.city,
              state: address.state,
              area: address.area,
            })
            .from(address)
            .where(eq(address.addressId, customerRow.addressId));

          customerData = {
            ...customerRow,
            address: addressRow || null,
          };
        }
      }

      return {
        ...order,
        customer: customerData,
      };
    })
  );

  return enrichedOrders;
}

// get all Order by customerId for report 
export async function getAllOrdersByOrderIdsForReport(orderIds: string[]) {
  if (orderIds.length === 0) return [];

  const data = await db.select({
    orderId: orders.orderId,
    productName: orders.productName,
    supplierName: supplier.supplierName,
    customerName: customer.customerName,
    type: orders.type,
    sample: orders.sample,
    stage: orders.stage,
    description: orders.description,
    targetDate: orders.targetDate,
    createdAt: orders.createdAt
  }).from(orders)
    .leftJoin(customer, eq(orders.customerId, customer.customerId))
    .leftJoin(supplier, eq(orders.supplierId, supplier.supplierId))
    .where(inArray(orders.orderId, orderIds))
    .orderBy(desc(orders.createdAt));

  return data;
}

// get all Order by supplierId for report 
export async function getAllOrdersBySupplierIdForReport(supplierId: string) {
  const data = await db.select({
    orderId: orders.orderId,
    productName: orders.productName,
    supplierName: supplier.supplierName,
    customerName: customer.customerName,
    type: orders.type,
    sample: orders.sample,
    stage: orders.stage,
    description: orders.description,
    targetDate: orders.targetDate,
    createdAt: orders.createdAt
  }).from(orders).leftJoin(customer, eq(orders.customerId, customer.customerId))
    .leftJoin(supplier, eq(orders.supplierId, supplier.supplierId))
    .where(eq(orders.supplierId, supplierId))
    .orderBy(desc(orders.createdAt));
  return data;
}

// get all sales by pagination and filter
export async function getSalesByPagination({
  page = 1,
  limit = 15,
  filter,
  search,
}: {
  page: number,
  limit: number,
  filter: SalesFilterRequest,
  search?: string,
}) {
  const conditionals = [] as SQL[];

  if (!filter.type) {
    return {
      data: [],
      metadata: {
        total: 0,
        limit,
        page,
      }
    };
  }
  // Order type
  if (filter.orderType) {
    conditionals.push(sql`${orders.type} = ${filter.orderType}`);
  }

  // Stage
  if (filter.stage) {
    conditionals.push(sql`${orders.stage} = ${filter.stage}`);
  }

  // Target Date Range
  if (filter.from && filter.to) {
    conditionals.push(sql`${orders.targetDate} BETWEEN ${filter.from} AND ${filter.to}`);
  } else if (filter.from) {
    conditionals.push(sql`${orders.targetDate} >= ${filter.from}`);
  } else if (filter.to) {
    conditionals.push(sql`${orders.targetDate} <= ${filter.to}`);
  }

  // If ID is a non-empty array, add filter
  if (Array.isArray(filter.id) && filter.id.length > 0) {
    if (filter.type === 'customer') {
      conditionals.push(sql`${orders.customerId} IN (${sql.join(filter.id, sql`, `)})`);
    } else if (filter.type === 'supplier') {
      conditionals.push(sql`${orders.supplierId} IN (${sql.join(filter.id, sql`, `)})`);
    }
  }

   let searchCondition;
 
   if (search) {
     const searchPattern = `%${search.toLowerCase()}%`;
   
     const productNameSearch = sql`LOWER(${orders.productName}) LIKE ${searchPattern}`;
     const orderIdSearch = sql`LOWER(${orders.orderId}) LIKE ${searchPattern}`;
     const supplierNameSearch = sql`LOWER(${supplier.supplierName}) LIKE ${searchPattern}`;
     const customerNameSearch = sql`LOWER(${customer.customerName}) LIKE ${searchPattern}`;
     const customerCompanySearch = sql`LOWER(${customer.companyName}) LIKE ${searchPattern}`;
     const customerMobileSearch = sql`LOWER(${customer.mobileNo}) LIKE ${searchPattern}`;

     searchCondition = or(productNameSearch, orderIdSearch, supplierNameSearch, customerNameSearch, customerCompanySearch, customerMobileSearch);
   }
 
   if (searchCondition) {
     conditionals.push(searchCondition);
   }

  const results = await db
    .select({
      orderId: orders.orderId,
      orderType: orders.type,
      stage: orders.stage,
      targetDate: orders.targetDate,
      productName: orders.productName,
      description: orders.description,

      customerId: customer.customerId,
      customerName: customer.customerName,
      customerCompany: customer.companyName,
      customerMobile: customer.mobileNo,
      customerAddressId: customer.addressId,

      supplierId: supplier.supplierId,
      supplierName: supplier.supplierName,
      supplierCompany: supplier.companyName,
      supplierMobile: supplier.mobileNo,
      supplierAddressId: supplier.addressId,
    })
    .from(orders)
    .leftJoin(customer, eq(orders.customerId, customer.customerId))
    .leftJoin(supplier, eq(orders.supplierId, supplier.supplierId))
    .where(and(...conditionals))
    .limit(limit)
    .offset((page - 1) * limit);



  // total and limit
  const [total] = await db
    .select({ total: sql<number>`count(*)` })
    .from(orders)
    .leftJoin(customer, eq(orders.customerId, customer.customerId))
    .leftJoin(supplier, eq(orders.supplierId, supplier.supplierId))
    .where(and(...conditionals));

  const addressIds = Array.from(new Set([
    ...results.map(r => r.customerAddressId),
    ...results.map(r => r.supplierAddressId)
  ])).filter(id => id !== null);

  const addressRows = await db
    .select({
      addressId: address.addressId,
      floor: address.floor,
      plotNo: address.plotNo,
      societyName: address.societyName,
      lane: address.lane,
      address: address.address,
      area: address.area,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      locationLink: address.locationLink,
      addressType: address.addressType,
    })
    .from(address)
    .where(sql`${address.addressId} IN (${sql.join(addressIds, sql`, `)})`);

  const addressMap = new Map(addressRows.map(addr => [addr.addressId, addr]));


  const finalData = results.map(row => ({
    ...row,
    customerAddress: row.customerAddressId && addressMap.get(row.customerAddressId) || null,
    supplierAddress: row.supplierAddressId && addressMap.get(row.supplierAddressId) || null,
  }));


  console.log(finalData);

  return {
    data: finalData,
    metadata: {
      total: total.total,
      limit,
      page,
    }
  };

}

// sales report with filter
export async function getSalesReportwithFilter(filter: SalesFilterRequest) {
  const conditionals = [] as SQL[];

  if (!filter.type) {
    return [];
  }
  // Order type
  if (filter.orderType) {
    conditionals.push(sql`${orders.type} = ${filter.orderType}`);
  }

  // Stage
  if (filter.stage) {
    conditionals.push(sql`${orders.stage} = ${filter.stage}`);
  }

  // Target Date Range
  if (filter.from && filter.to) {
    conditionals.push(sql`${orders.targetDate} BETWEEN ${filter.from} AND ${filter.to}`);
  } else if (filter.from) {
    conditionals.push(sql`${orders.targetDate} >= ${filter.from}`);
  } else if (filter.to) {
    conditionals.push(sql`${orders.targetDate} <= ${filter.to}`);
  }

  // If ID is a non-empty array, add filter
  if (Array.isArray(filter.id) && filter.id.length > 0) {
    if (filter.type === 'customer') {
      conditionals.push(sql`${orders.customerId} IN (${sql.join(filter.id, sql`, `)})`);
    } else if (filter.type === 'supplier') {
      conditionals.push(sql`${orders.supplierId} IN (${sql.join(filter.id, sql`, `)})`);
    }
  }

  const results = await db
    .select({
      orderId: orders.orderId,
      orderType: orders.type,
      stage: orders.stage,
      targetDate: orders.targetDate,
      productName: orders.productName,
      description: orders.description,

      customerId: customer.customerId,
      customerName: customer.customerName,
      customerCompany: customer.companyName,
      customerMobile: customer.mobileNo,
      customerAddressId: customer.addressId,

      supplierId: supplier.supplierId,
      supplierName: supplier.supplierName,
      supplierCompany: supplier.companyName,
      supplierMobile: supplier.mobileNo,
      supplierAddressId: supplier.addressId,
    })
    .from(orders)
    .leftJoin(customer, eq(orders.customerId, customer.customerId))
    .leftJoin(supplier, eq(orders.supplierId, supplier.supplierId))
    .where(and(...conditionals))



  const addressIds = Array.from(new Set([
    ...results.map(r => r.customerAddressId),
    ...results.map(r => r.supplierAddressId)
  ])).filter(id => id !== null);

  const addressRows = await db
    .select({
      addressId: address.addressId,
      floor: address.floor,
      plotNo: address.plotNo,
      societyName: address.societyName,
      lane: address.lane,
      address: address.address,
      area: address.area,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      locationLink: address.locationLink,
      addressType: address.addressType,
    })
    .from(address)
    .where(sql`${address.addressId} IN (${sql.join(addressIds, sql`, `)})`);


  const addressMap = new Map(addressRows.map(addr => [addr.addressId, addr]));


  const finalData = results.map(row => ({
    ...row,
    customerAddress: row.customerAddressId && addressMap.get(row.customerAddressId) || null,
    supplierAddress: row.supplierAddressId && addressMap.get(row.supplierAddressId) || null,
  }));

  return finalData;
}