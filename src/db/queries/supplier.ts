
import { db } from '@/db';
import { address, supplier } from '@/db/schema';
import { and, desc, eq, like, or, SQL, sql } from 'drizzle-orm';
import { SupplierFilter, SupplierInsert, SupplierUpdate } from '../type';
import { getAddressById } from './address';

// Create Supplier
export async function createSupplier(data: SupplierInsert) {
  const [s] = await db.insert(supplier).values(data).returning();
  return s;
}

// Update Supplier
export async function updateSupplier(id: string, data: SupplierUpdate) {
  const [s] = await db.update(supplier).set(data).where(eq(supplier.supplierId, id)).returning();
  return s;
}

// Get Supplier By ID
export async function getSupplierById(id: string) {
  const [s] = await db.select().from(supplier).where(eq(supplier.supplierId, id)).limit(1);
  return s;
}

// Delete Supplier
export async function deleteSupplier(id: string) {
  const [s] = await db.delete(supplier).where(eq(supplier.supplierId, id)).returning();
  return s;
}

export async function getAllSuppliers({
  limit = 15,
  offset = 0,
  filters = {},
  search,
}: {
  limit?: number;
  offset?: number;
  filters?: SupplierFilter;
  search?: string;
}) {
  const conditions = [] as SQL[];
  
  // Helper to generate LIKE conditions for JSON arrays
  const addJsonArrayFilter = (field: typeof supplier[keyof typeof supplier], values?: string[]) => {
    if (!values || values.length === 0) return;
    for (const value of values) {
      conditions.push(
        sql`json_extract(${field}, '$') LIKE ${'%' + value + '%'}`
      );
    }
  };


  addJsonArrayFilter(supplier.stock, filters.stock);
  addJsonArrayFilter(supplier.cordingBase, filters.cordingBase);
  addJsonArrayFilter(supplier.mainCategory, filters.mainCategory);
  addJsonArrayFilter(supplier.type, filters.type);
  addJsonArrayFilter(supplier.supplierMachineType, filters.supplierMachineType);
  addJsonArrayFilter(supplier.productPattern, filters.productPattern);
  addJsonArrayFilter(supplier.productionCapacity, filters.productionCapacity);

  let searchCondition;

  if (search) {
    const searchPattern = `%${search.toLowerCase()}%`;
  
    const supplierNameSearch = sql`LOWER(${supplier.supplierName}) LIKE ${searchPattern}`;
    
    const companyNameSearch = sql`LOWER(${supplier.companyName}) LIKE ${searchPattern}`;

    const mobileNoSearch = sql`LOWER(${supplier.mobileNo}) LIKE ${searchPattern}`;
    
    const gstNoSearch = sql`LOWER(${supplier.gstNo}) LIKE ${searchPattern}`;
  
    searchCondition = or(supplierNameSearch, companyNameSearch, mobileNoSearch, gstNoSearch);
  }

  if (searchCondition) {
    conditions.push(searchCondition);
  }
 
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const dataQuery = db
    .select()
    .from(supplier)
    .where(whereClause)
    .limit(limit)
    .orderBy(desc(supplier.createdAt))
    .offset(offset);

  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(supplier)
    .where(whereClause);

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

  const suppliersWithAddress = await Promise.all(addressPromises);

  
  
  return {
    data: suppliersWithAddress,
    total,
    limit,
    offset,
  };
}

// Get Supplier -> ID and Name
export async function getSupplierIdAndName() {
  const suppliers = await db
    .select({
      supplierId: supplier.supplierId,
      companyName: supplier.companyName,
    })
    .from(supplier);

  //  for all orders find all customer addess and  company name and mobile number

  // if supplier.companyName is null, set it to 'N/A'
  return suppliers.map(c => ({
    id: c.supplierId,
    name: c.companyName || 'Unknown Supplier',
  }));
}

// get All supplier for report
export async function getAllSuppliersForReport(filters: SupplierFilter) {
  const conditions = [] as SQL[];

  const addJsonArrayFilter = (field: typeof supplier[keyof typeof supplier], values?: string[]) => {
    if (!values || values.length === 0) return;
    for (const value of values) {
      conditions.push(
        sql`json_extract(${field}, '$') LIKE ${'%' + value + '%'}`
      );
    }
  };

  // Apply JSON array filters
  addJsonArrayFilter(supplier.stock, filters.stock);
  addJsonArrayFilter(supplier.cordingBase, filters.cordingBase);
  addJsonArrayFilter(supplier.mainCategory, filters.mainCategory);
  addJsonArrayFilter(supplier.type, filters.type);
  addJsonArrayFilter(supplier.supplierMachineType, filters.supplierMachineType);
  addJsonArrayFilter(supplier.productPattern, filters.productPattern);
  addJsonArrayFilter(supplier.productionCapacity, filters.productionCapacity);
   

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const suppliers = await db
    .select({
      supplierId: supplier.supplierId,
      companyName: supplier.companyName,
      supplierName: supplier.supplierName,
      mobileNo: supplier.mobileNo,
      gstNo: supplier.gstNo,
      workType: supplier.workType,
      productPattern: supplier.productPattern,
      supplierMachineType: supplier.supplierMachineType,
      mainCategory: supplier.mainCategory,
      jariBase: supplier.jariBase,
      cordingBase: supplier.cordingBase,
      type: supplier.type,
      stock: supplier.stock,
      productionCapacity: supplier.productionCapacity,
      notes: supplier.notes,
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
      createdAt: supplier.createdAt
    })
    .from(supplier)
    .leftJoin(address, eq(supplier.addressId, address.addressId))

    .where(whereClause)
    .orderBy(desc(supplier.createdAt));

    

  return suppliers;
}


// get supplier by id for report
export async function getSupplierByIdForReport(supplierId: string) {
  const supplierData = await db
    .select({
      supplierId: supplier.supplierId,
      companyName: supplier.companyName,
      supplierName: supplier.supplierName,
      mobileNo: supplier.mobileNo,
      workType : supplier.workType,
      productPattern : supplier.productPattern,
      supplierMachineType : supplier.supplierMachineType,
      mainCategory : supplier.mainCategory,
      jariBase : supplier.jariBase,
      cordingBase : supplier.cordingBase,
      type : supplier.type,
      stock : supplier.stock,
      productionCapacity : supplier.productionCapacity,
      notes : supplier.notes,
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
      createdAt: supplier.createdAt
    })
    .from(supplier)
    .innerJoin(address, eq(supplier.addressId, address.addressId))
    .where(eq(supplier.supplierId, supplierId))
    .limit(1);
  return supplierData;
}

export async function getAllSuppliersNameBySearch(search : string) {
const searchTerm = `%${search.toLowerCase()}%`;

  const suppliers = await db
    .select({
      id: supplier.supplierId,
      name: supplier.supplierName,
    })
    .from(supplier)
    .where(
      like(sql`lower(${supplier.supplierName})`, searchTerm)
    )
    .limit(15);

  return suppliers;

}