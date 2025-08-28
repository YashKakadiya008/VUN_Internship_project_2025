import { db } from '@/db';
import { address, customer, orders } from '@/db/schema';
import { and, desc, eq, like, or, SQL, sql } from 'drizzle-orm';
import { CustomerFilter, CustomerInsert, CustomerUpdate } from '../type';
import { getAddressById } from './address';

export async function createCustomer(data: CustomerInsert) {
  const [c] = await db.insert(customer).values(data).returning();
  return c;
}

export async function updateCustomer(id: string, data: CustomerUpdate) {
  const [c] = await db.update(customer).set(data).where(eq(customer.customerId, id)).returning();
  return c;
}

export async function getCustomerById(id: string) {
  const [c] = await db.select().from(customer).where(eq(customer.customerId, id)).limit(1);
  return c;
}

export async function deleteCustomer(id: string) {
  const [c] = await db.delete(customer).where(eq(customer.customerId, id)).returning();
  return c;
}

/**
 * Get paginated and filtered customers.
 */
// export async function getAllCustomers({
//   limit = 10,
//   offset = 0,
//   filters = {},
// }: {
//   limit?: number;
//   offset?: number;
//   filters?: CustomerFilter;
// }) {
//   const conditions = [];

//   if (filters.companyName && typeof filters.companyName === 'string') {
//     const name = filters.companyName.toLowerCase();
//     conditions.push(sql`LOWER(${customer.companyName}) LIKE ${'%' + name + '%'}`);
//   }

//   if (filters.customerName && typeof filters.customerName === 'string') {
//     const name = filters.customerName.toLowerCase();
//     conditions.push(sql`LOWER(${customer.customerName}) LIKE ${'%' + name + '%'}`);
//   }

//   if (filters.mobileNo) {
//     conditions.push(sql`${customer.mobileNo} = ${filters.mobileNo}`);
//   }

//   const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

//   const dataQuery = db
//     .select()
//     .from(customer)
//     .where(whereClause)
//     .limit(limit)
//     .offset(offset);

//   const countQuery = db
//     .select({ count: sql<number>`count(*)` })
//     .from(customer)
//     .where(whereClause);

//   const [data, countResult] = await Promise.all([dataQuery, countQuery]);
//   const total = countResult[0]?.count ?? 0;

//   return {
//     data,
//     total,
//     limit,
//     offset,
//   };
// }


export async function getAllCustomers({
  limit = 10,
  offset = 0,
  filters = {},
  search,
}: {
  limit?: number;
  offset?: number;
  filters?: CustomerFilter;
  search?: string;
}) {
  const conditions = [] as SQL[];

  const addJsonArrayFilter = (field: typeof customer[keyof typeof customer], values?: string[]) => {
    if (!values || values.length === 0) return;
    for (const value of values) {
      conditions.push(sql`json_extract(${field}, '$') LIKE ${'%' + value + '%'}`);
    }
  };

  // JSON filters
  addJsonArrayFilter(customer.workType, filters.workType);
  addJsonArrayFilter(customer.machineType, filters.machineType);
  addJsonArrayFilter(customer.making, filters.making);
  addJsonArrayFilter(customer.materialUsage, filters.materialUsage);
  addJsonArrayFilter(customer.type, filters.type);
  addJsonArrayFilter(customer.color, filters.color);
  addJsonArrayFilter(customer.subToneColor, filters.subToneColor);
  addJsonArrayFilter(customer.subMetallicColor, filters.subMetallicColor);
  addJsonArrayFilter(customer.taste, filters.taste);
  addJsonArrayFilter(customer.customerSaleChoice, filters.customerSaleChoice);
  addJsonArrayFilter(customer.customerSaleMethod, filters.customerSaleMethod);

  const addInClause = (field: typeof customer[keyof typeof customer], values?: string[]) => {
    if (!values || values.length === 0) return;
    conditions.push(sql`${field} IN (${sql.join(values.map(v => sql`${v}`), sql`,`)})`);
  };

  addInClause(customer.size, filters.size);
  addInClause(customer.range, filters.range);
  addInClause(customer.usageValueMonthly, filters.usageValueMonthly);
  addInClause(customer.paymentCycle, filters.paymentCycle);

  // Stage filter - requires join with orders table
  const needsOrdersJoin = filters.stage !== undefined;

  if (needsOrdersJoin && filters.stage) {
    conditions.push(eq(orders.stage, filters.stage));
  }

  // area is areaId
  if (filters.area) {
    conditions.push(eq(customer.areaId, filters.area));
  }

  let searchCondition;

  if (search) {
    const searchPattern = `%${search.toLowerCase()}%`;
  
    const customerNameSearch = sql`LOWER(${customer.customerName}) LIKE ${searchPattern}`;
    const companyNameSearch = sql`LOWER(${customer.companyName}) LIKE ${searchPattern}`;
    const mobileNoSearch = sql`LOWER(${customer.mobileNo}) LIKE ${searchPattern}`;
    const gstNoSearch = sql`LOWER(${customer.gstNo}) LIKE ${searchPattern}`;
  
    searchCondition = or(customerNameSearch, companyNameSearch, mobileNoSearch, gstNoSearch);
  }

  if (searchCondition) {
    conditions.push(searchCondition);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Build queries with conditional join - type-safe approach
  let dataQuery;
  let countQuery;

  if (needsOrdersJoin) {
    // Query with join
    dataQuery = db
      .select({
        customerId: customer.customerId,
        addressId: customer.addressId,
        companyName: customer.companyName,
        customerName: customer.customerName,
        mobileNo: customer.mobileNo,
        gstNo: customer.gstNo,
        workType: customer.workType,
        machineType: customer.machineType,
        making: customer.making,
        materialUsage: customer.materialUsage,
        type: customer.type,
        color: customer.color,
        subToneColor: customer.subToneColor,
        subMetallicColor: customer.subMetallicColor,
        taste: customer.taste,
        size: customer.size,
        range: customer.range,
        usageValueMonthly: customer.usageValueMonthly,
        paymentCycle: customer.paymentCycle,
        openForCollab: customer.openForCollab,
        customerSaleChoice: customer.customerSaleChoice,
        customerSaleMethod: customer.customerSaleMethod,
        notes: customer.notes,
        files: customer.files,
        productImages: customer.productImages,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      })
      .from(customer)
      .innerJoin(orders, eq(customer.customerId, orders.customerId))
      .where(whereClause)
      .groupBy(customer.customerId)
      .limit(limit)
      .orderBy(desc(customer.createdAt))
      .offset(offset);

    countQuery = db
      .select({ count: sql<number>`count(DISTINCT ${customer.customerId})` })
      .from(customer)
      .innerJoin(orders, eq(customer.customerId, orders.customerId))
      .where(whereClause);
  } else {
    // Query without join
    dataQuery = db
      .select()
      .from(customer)
      .where(whereClause)
      .limit(limit)
      .orderBy(desc(customer.createdAt))
      .offset(offset);

    countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(customer)
      .where(whereClause);
  }

  const [data, countResult] = await Promise.all([dataQuery, countQuery]);
  const total = countResult[0]?.count ?? 0;

  // ==== Fetch address using getAddressById ====
  const addressPromises = data.map(async (c) => {
    const address = c.addressId ? await getAddressById(c.addressId) : null;
    return {
      ...c,
      address,
    };
  });

  const customersWithAddress = await Promise.all(addressPromises);

  return {
    data: customersWithAddress,
    total,
    limit,
    offset,
  };
}
// all customers -> id and name
export async function getAllCustomersIdAndName() {
  const customers = await db
    .select({
      customerId: customer.customerId,
      customerName: customer.customerName,
      companyName: customer.companyName,
    })
    .from(customer)
    .orderBy(customer.customerName);

  return customers.map(c => ({
    id: c.customerId,
    name: c.customerName || 'Unknown Customer',
    companyName: c.companyName || 'Unknown Company',
  }));
}

// get all customer data for report
export async function getAllCustomersForReport(filters: CustomerFilter = {}) {
  const conditions = [] as SQL[];

  const addJsonArrayFilter = (field: typeof customer[keyof typeof customer], values?: string[]) => {
    if (!values || values.length === 0) return;
    for (const value of values) {
      conditions.push(sql`json_extract(${field}, '$') LIKE ${'%' + value + '%'}`);
    }
  };

  // JSON filters
  addJsonArrayFilter(customer.workType, filters.workType);
  addJsonArrayFilter(customer.machineType, filters.machineType);
  addJsonArrayFilter(customer.making, filters.making);
  addJsonArrayFilter(customer.materialUsage, filters.materialUsage);
  addJsonArrayFilter(customer.type, filters.type);
  addJsonArrayFilter(customer.color, filters.color);
  addJsonArrayFilter(customer.subToneColor, filters.subToneColor);
  addJsonArrayFilter(customer.subMetallicColor, filters.subMetallicColor);
  addJsonArrayFilter(customer.taste, filters.taste);
  addJsonArrayFilter(customer.customerSaleChoice, filters.customerSaleChoice);
  addJsonArrayFilter(customer.customerSaleMethod, filters.customerSaleMethod);

  const addInClause = (field: typeof customer[keyof typeof customer], values?: string[]) => {
    if (!values || values.length === 0) return;
    conditions.push(sql`${field} IN (${sql.join(values.map(v => sql`${v}`), sql`,`)})`);
  };

  addInClause(customer.size, filters.size);
  addInClause(customer.range, filters.range);
  addInClause(customer.usageValueMonthly, filters.usageValueMonthly);
  addInClause(customer.paymentCycle, filters.paymentCycle);

  // Area filter
  if (filters.area) {
    conditions.push(eq(customer.areaId, filters.area));
  }

  if (filters.stage) {
    conditions.push(eq(orders.stage, filters.stage));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const customers = await db
    .select({
      customerId: customer.customerId,
      companyName: customer.companyName,
      customerName: customer.customerName,
      reference: customer.reference,
      mobileNo: customer.mobileNo,
      workType: customer.workType,
      machineType: customer.machineType,
      making: customer.making,
      materialUsage: customer.materialUsage,
      type: customer.type,
      color: customer.color,
      subToneColor: customer.subToneColor,
      subMetallicColor: customer.subMetallicColor,
      taste: customer.taste,
      size: customer.size,
      range: customer.range,
      usageValueMonthly: customer.usageValueMonthly,
      paymentCycle: customer.paymentCycle,
      openForCollab: customer.openForCollab,
      customerSaleChoice: customer.customerSaleChoice,
      customerSaleMethod: customer.customerSaleMethod,
      notes: customer.notes,
      gstNo: customer.gstNo,
      floor: address.floor,
      plotNo: address.plotNo,
      societyName: address.societyName,
      area: address.area,
      lane: address.lane,
      city: address.city,
      address: address.address,
      state: address.state,
      pincode: address.pincode,
      locationLink: address.locationLink,
      createdAt: customer.createdAt,
    })
    .from(customer)
    .leftJoin(address, eq(customer.addressId, address.addressId))
    .where(whereClause)
    .orderBy(customer.customerName, desc(customer.createdAt));

  return customers;
}


// get customerById for report
export async function getCustomerByIdForReport(customerId: string) {
  const customerData = await db
    .select({
      customerId: customer.customerId,
      companyName: customer.companyName,
      customerName: customer.customerName,
      mobileNo: customer.mobileNo,
      reference: customer.reference,
      workType: customer.workType,
      machineType: customer.machineType,
      making: customer.making,
      materialUsage: customer.materialUsage,
      type: customer.type,
      color: customer.color,
      subToneColor: customer.subToneColor,
      subMetallicColor: customer.subMetallicColor,
      taste: customer.taste,
      size: customer.size,
      range: customer.range,
      usageValueMonthly: customer.usageValueMonthly,
      paymentCycle: customer.paymentCycle,
      openForCollab: customer.openForCollab,
      customerSaleChoice: customer.customerSaleChoice,
      customerSaleMethod: customer.customerSaleMethod,
      notes: customer.notes,
      gstNo: customer.gstNo,
      floor: address.floor,
      plotNo: address.plotNo,
      societyName: address.societyName,
      area: address.area,
      lane: address.lane,
      city: address.city,
      address: address.address,
      state: address.state,
      pincode: address.pincode,
      locationLink: address.locationLink,
      createdAt: customer.createdAt,
    })
    .from(customer)
    .leftJoin(address, eq(customer.addressId, address.addressId))
    .where(eq(customer.customerId, customerId))
    .limit(1);

  return customerData;
}

export async function getAllCustomerNameBySearch(search: string) {
  const searchTerm = `%${search.toLowerCase()}%`;
  const customers = await db
    .select({
      id: customer.customerId,
      name: customer.customerName,
    })
    .from(customer)
    .where(
      like(sql`lower(${customer.customerName})`, searchTerm),
    ).limit(15);

  return customers;
}