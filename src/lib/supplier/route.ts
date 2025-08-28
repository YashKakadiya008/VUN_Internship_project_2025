import { AddressInsert, SupplierInsert } from "@/db";
import { createAddress, deleteAddress, getAddressById, updateAddress } from "@/db/queries/address";
import { createSupplier, deleteSupplier, getAllSuppliers, getAllSuppliersNameBySearch, getSupplierById, updateSupplier } from "@/db/queries/supplier";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { authMiddleware } from "../middleware";
import { deleteImageFromCloudinary, getSignedImageUrl, uploadImageToCloudinary } from "../upload/image";
import { deletePdfFromCloudinary, getSignedPdfUrl, uploadMultiplePdfsToCloudinary } from "../upload/pdf";
import { CreateSupplierRequest, DeleteSupplierRequest, GetAllSuppliersRequest, GetSupplierRequest, UpdateSupplierRequest } from "./type";
import z from "zod";

export const supplierRoute = new Hono();

// Create a supplier
supplierRoute.post('/create', zValidator('form', CreateSupplierRequest), authMiddleware(), async (c) => {

  const body = await c.req.parseBody();

  const data = c.req.valid('form');


  // ========== Address Fields ==========
  const addressInput: AddressInsert = {
    floor: data.floor ?? null,
    address: data.address ?? null,
    area: data.area ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    pincode: data.pincode ?? null,
    locationLink: data.locationLink ?? null,
    addressType: 'Supplier',
  };

  const savedAddress = await createAddress(addressInput);

  // ========== Handle image uploads ==========
  const imageFiles = Array.isArray(body['images[]'])
    ? body['images[]']
    : body['images[]']
      ? [body['images[]']]
      : [];

  const imageNotes = data.imageNotes;

  const uploadedImages = await Promise.all(
    imageFiles
      .filter((f): f is File => f instanceof File)
      .map((file, idx) => uploadImageToCloudinary(file, file.name, 'suppliers')
        .then((img) => ({
          id: img.public_id,
          name: img.name,
          note: imageNotes[idx] ?? '',
        }))
      )
  );

  // ========== Handle PDF uploads ==========
  const pdfFiles = Array.isArray(body['files[]'])
    ? body['files[]']
    : body['files[]']
      ? [body['files[]']]
      : [];

  const fileNotes = data.fileNotes;

  const uploadedPDFsRaw = await uploadMultiplePdfsToCloudinary(
    pdfFiles.filter((f): f is File => f instanceof File)
  );

  const uploadedPDFs = uploadedPDFsRaw.map((pdf, idx) => ({
    id: pdf.public_id,
    name: pdf.name,
    note: fileNotes[idx] ?? '',
  }));

  // ========== Supplier Fields ==========
  const supplierData: SupplierInsert = {
    addressId: savedAddress.addressId,
    companyName: data.companyName ?? null,
    supplierName: data.supplierName ?? null,
    mobileNo: data.mobileNo ?? null,
    gstNo: data.gstNo ?? null,
    workType: data.workType ?? null,
    productPattern: data.productPattern ?? null,
    supplierMachineType: data.supplierMachineType ?? null,
    mainCategory: data.mainCategory ?? null,
    jariBase: data.jariBase ?? null,
    cordingBase: data.cordingBase ?? null,
    type: data.type ?? null,
    stock: data.stock ?? null,
    productionCapacity: data.productionCapacity ?? null,
    notes: data.notes ?? null,
    files: uploadedPDFs,
    images: uploadedImages,
  };

  try {
    const savedSupplier = await createSupplier(supplierData);

    return c.json({
      message: 'Supplier created successfully',
      supplierId: savedSupplier.supplierId,
      savedSupplier,
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return c.json({ error: 'Failed to create supplier', details: error }, 500);
  }
});

// Update a supplier
supplierRoute.post('/update/:id', zValidator('form', UpdateSupplierRequest), authMiddleware(), async (c) => {
  const body = await c.req.parseBody();
  const supplierId = c.req.param('id');
  const data = c.req.valid('form');

  if (!supplierId) return c.json({ error: 'Missing supplierId' }, 400);

  const existingSupplier = await getSupplierById(supplierId);
  if (!existingSupplier) return c.json({ error: 'Supplier not found' }, 404);

  // ---------- Address Update ----------
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
    addressType: 'Supplier',
  };
  await updateAddress(existingSupplier.addressId, addressInput);

  // ---------- Images ----------
  const existingImageIds = data.existingImages ?? [];

  const imagesToDelete = (existingSupplier.images ?? []).filter(
    (img) => !existingImageIds.includes(img.id)
  );
  await Promise.all(imagesToDelete.map((img) => deleteImageFromCloudinary(img.id)));

  const keptImages = (existingSupplier.images ?? []).filter((img) =>
    existingImageIds.includes(img.id)
  );

  const newImageFiles = Array.isArray(body['images[]'])
    ? body['images[]']
    : body['images[]']
      ? [body['images[]']]
      : [];

  const newImageNotes = data.imageNotes ?? [];

  const uploadedNewImages = await Promise.all(
    newImageFiles
      .filter((f): f is File => f instanceof File)
      .map((file, idx) =>
        uploadImageToCloudinary(file, file.name, 'suppliers').then((img) => ({
          id: img.public_id,
          name: img.name,
          note: newImageNotes[idx] ?? '',
        }))
      )
  );

  const finalImages = [...keptImages, ...uploadedNewImages];

  // ---------- Files (PDFs) ----------
  const existingFileIds = data.existingFiles ?? [];

  const filesToDelete = (existingSupplier.files ?? []).filter(
    (file) => !existingFileIds.includes(file.id)
  );
  await Promise.all(filesToDelete.map((file) => deletePdfFromCloudinary(file.id)));

  const keptFiles = (existingSupplier.files ?? []).filter((file) =>
    existingFileIds.includes(file.id)
  );

  const newPDFFiles = Array.isArray(body['files[]'])
    ? body['files[]']
    : body['files[]']
      ? [body['files[]']]
      : [];

  const newFileNotes = data.fileNotes ?? [];

  const uploadedNewFilesRaw = await uploadMultiplePdfsToCloudinary(
    newPDFFiles.filter((f): f is File => f instanceof File)
  );

  const uploadedNewFiles = uploadedNewFilesRaw.map((pdf, idx) => ({
    id: pdf.public_id,
    name: pdf.name,
    note: newFileNotes[idx] ?? '',
  }));

  const finalFiles = [...keptFiles, ...uploadedNewFiles];

  // ---------- Final Supplier Update ----------
  const updatedSupplierData: Partial<SupplierInsert> = {
    companyName: data.companyName ?? null,
    supplierName: data.supplierName ?? null,
    mobileNo: data.mobileNo ?? null,
    gstNo: data.gstNo ?? null,
    workType: data.workType ?? null,
    productPattern: data.productPattern ?? null,
    supplierMachineType: data.supplierMachineType ?? null,
    mainCategory: data.mainCategory ?? null,
    jariBase: data.jariBase ?? null,
    cordingBase: data.cordingBase ?? null,
    type: data.type ?? null,
    stock: data.stock ?? null,
    productionCapacity: data.productionCapacity ?? null,
    notes: data.notes ?? null,
    files: finalFiles,
    images: finalImages,
  };

  try {
    const updatedSupplier = await updateSupplier(supplierId, updatedSupplierData);
    return c.json({
      message: 'Supplier updated successfully',
      supplierId,
      updatedSupplier,
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return c.json({ error: 'Failed to update supplier', details: error }, 500);
  }
}
);

// Delete a supplier
supplierRoute.delete('/delete/:id', zValidator('param', DeleteSupplierRequest), authMiddleware(), async (c) => {

  const data = c.req.valid('param');

  const supplierId = data.id;

  if (!supplierId) return c.json({ error: 'Missing supplier ID' }, 400);

  // Fetch existing supplier
  const existingSupplier = await getSupplierById(supplierId);
  if (!existingSupplier) return c.json({ error: 'Supplier not found' }, 404);

  try {
    // Delete images from Cloudinary
    const images = existingSupplier.images ?? [];
    await Promise.all(images.map(img => deleteImageFromCloudinary(img.id)));

    // Delete files (PDFs) from Cloudinary
    const files = existingSupplier.files ?? [];
    await Promise.all(files.map(file => deletePdfFromCloudinary(file.id)));

    // Delete address
    if (existingSupplier.addressId) {
      await deleteAddress(existingSupplier.addressId);
    }

    // Delete supplier record
    await deleteSupplier(supplierId);

    return c.json({ message: `Supplier with ID ${supplierId} deleted successfully` });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return c.json({ error: 'Failed to delete supplier', details: error }, 500);
  }
});

// Get a supplier by ID
supplierRoute.get('/get-one/:id', zValidator('param', GetSupplierRequest), authMiddleware(), async (c) => {

  const data = c.req.valid('param');

  const supplierId = data.id;

  if (!supplierId) return c.json({ error: 'Missing supplier ID' }, 400);

  const supplier = await getSupplierById(supplierId);
  if (!supplier) return c.json({ error: 'Supplier not found' }, 404);

  // Generate signed URLs for images
  const imagesWithSignedUrls = (supplier.images ?? []).map(img => ({
    ...img,
    signedUrl: getSignedImageUrl(img.id),
  }));

  // Generate downloadable URLs for PDFs/files
  const filesWithDownloadUrls = (supplier.files ?? []).map(file => ({
    ...file,
    signedUrl: getSignedPdfUrl(file.id),
  }));

  // address
  const address = await getAddressById(supplier.addressId);

  // Return merged response
  return c.json({
    ...supplier,
    images: imagesWithSignedUrls,
    files: filesWithDownloadUrls,
    address,
  });
});

// Get all suppliers with pagination and filtering
supplierRoute.post('/get-all', zValidator('json', GetAllSuppliersRequest), authMiddleware(), async (c) => {

  const data = c.req.valid('json');

  const limit = data.limit || 10;
  const offset = data.offset || 0;

  const filters = {
    workType: data.filters?.workType ?? undefined,
    productPattern: data.filters?.productPattern ?? undefined,
    supplierMachineType: data.filters?.supplierMachineType ?? undefined,
    mainCategory: data.filters?.mainCategory ?? undefined,
    jariBase: data.filters?.jariBase ?? undefined,
    cordingBase: data.filters?.cordingBase ?? undefined,
    type: data.filters?.type ?? undefined,
    stock: data.filters?.stock ?? undefined,
    productionCapacity: data.filters?.productionCapacity ?? undefined,
  };


  const { data: suppliers, total } = await getAllSuppliers({ limit, offset, filters, search: data.search });

  const enrichedSuppliers = await Promise.all(suppliers.map(async supplier => {
    const images = (supplier.images ?? []).map(img => ({
      ...img,
      signedUrl: getSignedImageUrl(img.id),
    }));

    // address
    const address = await getAddressById(supplier.addressId);

    const files = (supplier.files ?? []).map(file => ({
      ...file,
      signedUrl: getSignedPdfUrl(file.id),
    }));

    return {
      ...supplier,
      images,
      files,
      address,
    };
  }));

  return c.json({
    data: enrichedSuppliers,
    total,
    limit,
    offset,
  });
});

// get-all supplier name and it with search
supplierRoute.post('/get-all-supplier-name', zValidator('json', z.object({
  search: z.string().optional(),
}))
  , authMiddleware(), async (c) => {

    try{
      const data = c.req.valid('json');

      const search = data.search ?? '';

      const suppliers = await getAllSuppliersNameBySearch(search);
      return c.json(suppliers);

    }
     catch (error) {
      console.error('Error fetching supplier name:', error);
      return c.json({ error: 'Failed to fetch supplier name', details: error }, 500);
    }

});
