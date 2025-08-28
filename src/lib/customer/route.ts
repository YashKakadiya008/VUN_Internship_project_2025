import { createAddress, deleteAddress, getAddressById, updateAddress } from "@/db/queries/address";
import { createCustomer, deleteCustomer, getAllCustomerNameBySearch, getAllCustomers, getCustomerById, updateCustomer } from "@/db/queries/customer";
import { Hono } from "hono";

import { AddressInsert, CustomerInsert } from "@/db";
import { createArea, getAllAreas, getAreaByName } from "@/db/queries/area";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware";
import { deleteImageFromCloudinary, getSignedImageUrl, uploadImageToCloudinary } from "../upload/image";
import { deletePdfFromCloudinary, getSignedPdfUrl, uploadMultiplePdfsToCloudinary } from "../upload/pdf";
import { CreateCustomerRequest, DeleteCustomerRequest, GetAllCustomersRequest, GetCustomerRequest, UpdateCustomerRequest } from "./type";
import z from "zod";
export const customerRoute = new Hono();


// create a customer
customerRoute.post('/create', zValidator('form', CreateCustomerRequest), authMiddleware(), async (c) => {
  const body = await c.req.parseBody();

  const data = c.req.valid('form');

  // ========== Address Fields ==========
  const addressInput: AddressInsert = {
    floor: data.floor ?? null,
    plotNo: data.plotNo ?? null,
    societyName: data.societyName ?? null,
    lane: data.lane ?? null,
    address: data.address ?? null,
    area: data.area ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    pincode: data.pincode ?? null,
    locationLink: data.locationLink ?? null,
    addressType: 'Customer',
  };

  const savedAddress = await createAddress(addressInput);



  // array fields
  const {
    materialUsage,
    type,
    color,
    machineType,
    making,
    subToneColor,
    taste,
    customerSaleChoice,
    customerSaleMethod,
    workType,
  } = data;




  // ========== Handle image uploads ==========
  const imageFiles = body['productImages[]'] ? Array.isArray(body['productImages[]']) ? body['productImages[]'] : [body['productImages[]']] : [];


  const imageNotes = data.productImageNotes;

  const uploadedImages = await Promise.all(
    imageFiles
      .filter((f): f is File => f instanceof File)
      .map((file, idx) => uploadImageToCloudinary(file, file.name, 'customers')
        .then((img) => ({
          public_id: img.public_id,
          name: img.name,
          note: imageNotes[idx] ?? '', // Match note by index
        }))
      )
  );


  // ========== Handle PDF uploads ==========
  const pdfFiles = body['files[]'] ? Array.isArray(body['files[]']) ? body['files[]'] : [body['files[]']] : [];



  const uploadedPDFsRaw = await uploadMultiplePdfsToCloudinary(
    pdfFiles.filter((f): f is File => f instanceof File)
  );

  const uploadedPDFs = uploadedPDFsRaw.map((pdf) => ({
    public_id: pdf.public_id,
    name: pdf.name,
    note: ''
  }));

  let area_id = null;

  if (data.area) {

    // check if area exists
    const existingArea = await getAreaByName(data.area);

    if (existingArea) {
      area_id = existingArea.areaId;
    }

    // if area doesn't exist, create it
    if (!existingArea) {
      try {
        const result = await createArea(data.area);
        area_id = result.areaId;
      }
      catch (error) {
        console.error('Error creating area:', error);
      }
    }

  }
  // ========== Customer Fields ==========
  const customerData: CustomerInsert = {
    areaId: area_id ?? null,
    addressId: savedAddress.addressId,
    companyName: data.companyName ?? null,
    customerName: data.customerName ?? null,
    reference: data.reference ?? null,
    mobileNo: data.mobileNo ?? null,
    gstNo: data.gstNo ?? null,
    size: data.size ?? null,
    range: data.range ?? null,
    usageValueMonthly: data.usageValueMonthly ?? null,
    paymentCycle: data.paymentCycle ?? null,
    openForCollab: data.openForCollab,
    notes: data.notes ?? null,
    workType: workType ?? null,
    machineType: machineType ?? null,
    making: making ?? null,
    materialUsage: materialUsage ?? null,
    type: type ?? null,
    color: color ?? null,
    subMetallicColor: data.subMetallicColor,
    subToneColor: subToneColor ?? null,
    taste: taste ?? null,
    customerSaleChoice: customerSaleChoice ?? null,
    customerSaleMethod: customerSaleMethod ?? null,
    files: uploadedPDFs,
    productImages: uploadedImages,
  };

  try {
    const savedCustomer = await createCustomer(customerData);

    return c.json({
      message: 'Customer created successfully',
      customerId: savedCustomer.customerId,
      savedCustomer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return c.json({ error: 'Failed to create customer', details: error }, 500);
  }
});

// update a customer
customerRoute.put("/update", zValidator("form", UpdateCustomerRequest), authMiddleware(), async (c) => {
  const body = await c.req.parseBody();
  const data = c.req.valid("form");
  const customerId = data.customerId;


  const existingCustomer = await getCustomerById(customerId);
  if (!existingCustomer) return c.json({ error: "Customer not found" }, 404);

  // ---------- Address ----------
  const addressInput: AddressInsert = {
    floor: data.floor ?? null,
    plotNo: data.plotNo ?? null,
    societyName: data.societyName ?? null,
    lane: data.lane ?? null,
    address: data.address ?? null,
    area: data.area ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    pincode: data.pincode ?? null,
    locationLink: data.locationLink ?? null,
    addressType: "Customer",
  };
  await updateAddress(existingCustomer.addressId, addressInput);

  // ---------- Product Images ----------
  const existingImageIds = data.existingProductImages ?? [];

  const imagesToDelete = (existingCustomer.productImages ?? []).filter(
    (img) => !existingImageIds.includes(img.public_id)
  );
  await Promise.all(
    imagesToDelete.map((img) => deleteImageFromCloudinary(img.public_id))
  );

  const keptImages = (existingCustomer.productImages ?? []).filter((img) =>
    existingImageIds.includes(img.public_id)
  );

  const newImageFiles = Array.isArray(body["productImages[]"])
    ? body["productImages[]"]
    : body["productImages[]"]
      ? [body["productImages[]"]]
      : [];

  const newImageNotes = data.productImageNotes ?? [];

  const uploadedNewImages = await Promise.all(
    newImageFiles
      .filter((f): f is File => f instanceof File)
      .map((file, idx) =>
        uploadImageToCloudinary(file, file.name, "customers").then((img) => ({
          public_id: img.public_id,
          name: img.name,
          note: newImageNotes[idx] ?? "",
        }))
      )
  );

  const finalImages = [...keptImages, ...uploadedNewImages];

  // ---------- Files (PDFs) ----------
  const existingFileIds = data.existingFiles ?? [];

  const filesToDelete = (existingCustomer.files ?? []).filter(
    (file) => !existingFileIds.includes(file.public_id)
  );
  await Promise.all(
    filesToDelete.map((file) => deletePdfFromCloudinary(file.public_id))
  );

  const keptFiles = (existingCustomer.files ?? []).filter((file) =>
    existingFileIds.includes(file.public_id)
  );

  const newPDFFiles = Array.isArray(body["files[]"])
    ? body["files[]"]
    : body["files[]"]
      ? [body["files[]"]]
      : [];



  const uploadedNewFilesRaw = await uploadMultiplePdfsToCloudinary(
    newPDFFiles.filter((f): f is File => f instanceof File)
  );

  const uploadedNewFiles = uploadedNewFilesRaw.map((pdf) => ({
    public_id: pdf.public_id,
    name: pdf.name,
    note: ''
  }));

  const finalFiles = [...keptFiles, ...uploadedNewFiles];

  // ---------- Update Customer ----------
  const updatedCustomerData: Partial<CustomerInsert> = {
    companyName: data.companyName ?? null,
    customerName: data.customerName ?? null,
    reference: data.reference ?? null,
    mobileNo: data.mobileNo ?? null,
    gstNo: data.gstNo ?? null,
    size: data.size ?? null,
    range: data.range ?? null,
    usageValueMonthly: data.usageValueMonthly ?? null,
    paymentCycle: data.paymentCycle ?? null,
    openForCollab: data.openForCollab ?? null,
    notes: data.notes ?? null,
    workType: data.workType,
    machineType: data.machineType,
    making: data.making,
    materialUsage: data.materialUsage,
    type: data.type,
    color: data.color,
    subToneColor: data.subToneColor,
    subMetallicColor: data.subMetallicColor,
    taste: data.taste,
    customerSaleChoice: data.customerSaleChoice,
    customerSaleMethod: data.customerSaleMethod,
    files: finalFiles,
    productImages: finalImages,
  };

  try {
    const updatedCustomer = await updateCustomer(customerId, updatedCustomerData);
    return c.json({
      message: "Customer updated successfully",
      customerId,
      updatedCustomer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return c.json({ error: "Failed to update customer", details: error }, 500);
  }
}
);

// delete a customer
customerRoute.delete('/delete/:id', zValidator('param', DeleteCustomerRequest), authMiddleware(), async (c) => {
  const data = c.req.valid('param');

  const customerId = data.id;

  if (!customerId) return c.json({ error: 'Missing customer ID' }, 400);

  // Fetch existing customer
  const existingCustomer = await getCustomerById(customerId);
  if (!existingCustomer) return c.json({ error: 'Customer not found' }, 404);

  try {
    // Delete product images from Cloudinary
    const images = existingCustomer.productImages ?? [];
    await Promise.all(images.map(img => deleteImageFromCloudinary(img.public_id)));

    // Delete files (PDFs) from Cloudinary
    const files = existingCustomer.files ?? [];
    await Promise.all(files.map(file => deletePdfFromCloudinary(file.public_id)));

    // Delete address
    if (existingCustomer.addressId) {
      await deleteAddress(existingCustomer.addressId);
    }

    // Delete customer record
    await deleteCustomer(customerId);

    return c.json({ message: `Customer with ID ${customerId} deleted successfully` });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return c.json({ error: 'Failed to delete customer', details: error }, 500);
  }
});

// get a customer by ID
customerRoute.get('/get-one/:id', zValidator('param', GetCustomerRequest), authMiddleware(), async (c) => {

  const data = c.req.valid('param');

  const customerId = data.id;

  if (!customerId) return c.json({ error: 'Missing customer ID' }, 400);

  const customer = await getCustomerById(customerId);
  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  // Fetch address
  const address = customer.addressId ? await getAddressById(customer.addressId) : null;

  // Generate signed URLs for images
  const imagesWithSignedUrls = (customer.productImages ?? []).map(img => ({
    ...img,
    signedUrl: getSignedImageUrl(img.public_id),
  }));

  // Generate downloadable URLs for PDFs/files
  const filesWithDownloadUrls = (customer.files ?? []).map(file => ({
    ...file,
    signedUrl: getSignedPdfUrl(file.public_id),
  }));

  // Return merged response
  return c.json({
    ...customer,
    address,
    productImages: imagesWithSignedUrls,
    files: filesWithDownloadUrls,
  });
});

//get all customers with pagination and filtering
customerRoute.post('/get-all', zValidator('json', GetAllCustomersRequest), authMiddleware(), async (c) => {

  const data = c.req.valid('json');


  const limit = Number(data.limit) || 10;
  const offset = Number(data.offset) || 0;

  const filters = {
    workType: data.filters?.workType ?? undefined,
    machineType: data.filters?.machineType ?? undefined,
    making: data.filters?.making ?? undefined,
    materialUsage: data.filters?.materialUsage ?? undefined,
    type: data.filters?.type ?? undefined,
    color: data.filters?.color ?? undefined,
    subToneColor: data.filters?.subToneColor ?? undefined,
    subMetallicColor: data.filters?.subMetallicColor ?? undefined,
    taste: data.filters?.taste ?? undefined,
    customerSaleChoice: data.filters?.customerSaleChoice ?? undefined,
    customerSaleMethod: data.filters?.customerSaleMethod ?? undefined,
    Size: data.filters?.Size ?? undefined,
    range: data.filters?.range ?? undefined,
    usageValueMonthly: data.filters?.usageValueMonthly ?? undefined,
    paymentCycle: data.filters?.paymentCycle ?? undefined,
    stage: data.filters?.stage ?? undefined,
    area: data.filters?.area ?? undefined
  };

  const { data: customers, total } = await getAllCustomers({ limit, offset, filters, search: data.search });

  const enrichedCustomers = customers.map(customer => {
    const productImages = (customer.productImages ?? []).map(img => ({
      ...img,
      signedUrl: getSignedImageUrl(img.public_id),
    }));

    const files = (customer.files ?? []).map(file => ({
      ...file,
      signedUrl: getSignedPdfUrl(file.public_id),
    }));

    return {
      ...customer,
      productImages,
      files,
    };
  });

  return c.json({
    data: enrichedCustomers,
    total,
    limit,
    offset,
  });
});

// get all areas
customerRoute.get('/get-all-area', authMiddleware(), async (c) => {
  try {
    const areas = await getAllAreas();
    return c.json(areas);
  } catch (error) {
    console.error('Failed to fetch areas:', error);
    return c.json({ message: 'Failed to fetch areas' }, 500);
  }
});

// get all customer and it's name and id with search
customerRoute.post('/get-all-customer-name',zValidator('json',z.object({search:z.string().optional()})),authMiddleware(), async (c) => {
  try {
    const data = c.req.valid('json');
    const search = data.search ?? '';
    const customers = await getAllCustomerNameBySearch(search);
    return c.json(customers);
  } catch (error) {
    console.error('Error fetching customer name:', error);
    return c.json({ error: 'Failed to fetch customer name', details: error }, 500);
  }
});