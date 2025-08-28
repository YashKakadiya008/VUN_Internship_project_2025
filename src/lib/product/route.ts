import { createProduct, deleteProduct, getAllProducts, getProductById, updateProduct } from '@/db/queries/product';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { authMiddleware } from '../middleware';
import { deleteImageFromCloudinary, getSignedImageUrl, uploadFiles } from '../upload/image';
import { CreateProductRequest, DeleteProductRequest, GetAllProductsRequest, GetAllProductsResponse, GetProductRequest, ProductInsertSchema, ProductUpdateSchema, UpdateProductRequest } from './type';

export const productRoute = new Hono();

// Create a new product
productRoute.post('/create', zValidator('form', CreateProductRequest), authMiddleware(), async (c) => {
  const body = await c.req.parseBody();

  const data = c.req.valid('form');


  // Normalize image(s)
  const rawImages = body['images[]'];

  const imagesArray = Array.isArray(rawImages) ? rawImages : rawImages ? [rawImages] : [];

  // Upload files
  const filesToUpload = imagesArray.filter((img): img is File => img instanceof File);
  const images = await uploadFiles(filesToUpload, 'productImages');

  // Build product data
  const productData = {
    supplierId: data.supplierId,
    vnuProductName: data.vnuProductName,
    productName: data.productName,    
    moq: data.moq,
    productPattern: Array.isArray(data.productPattern) ? data.productPattern : data.productPattern ? [data.productPattern] : [],
    mainCategory: Array.isArray(data.mainCategory) ? data.mainCategory : data.mainCategory ? [data.mainCategory] : [],
    type: data.type,
    color: data.color,
    subToneColor: data.subToneColor,
    size: data.size,
    salesRate : data.salesRate,
    purchaseRate : data.purchaseRate,
    jariBase: Array.isArray(data.jariBase) ? data.jariBase : data.jariBase ? [data.jariBase] : [],
    // cordingBase: data.cordingBase,
    images, // uploaded image URLs or metadata
  };

  // Schema validation
  const parsed = ProductInsertSchema.safeParse(productData);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  // Save product
  const product = await createProduct(productData);


  return c.json({ message: 'Product created', product });
});


// update a product
productRoute.put('/update', zValidator('form', UpdateProductRequest), authMiddleware(), async (c) => {
  const body = await c.req.parseBody();
  const data = c.req.valid('form');

  const productId = data.productId;
  const existing = await getProductById(productId);

  if (!existing) return c.json({ error: 'Product not found' }, 404);

  // Step 2: Handle deletions (based on existingImages public_ids)
  const retainedPublicIds = data.existingImages || [];
  const existingImageIds = new Set(existing.images?.map((img) => img.public_id) || []);
  const incomingImageIds = new Set(retainedPublicIds);
  const imagesToDelete = [...existingImageIds].filter((id) => !incomingImageIds.has(id));

  for (const public_id of imagesToDelete) {
    await deleteImageFromCloudinary(public_id);
  }

  // Step 3: Upload new images (from 'newImages[]')
  let uploadedNewImages: { public_id: string; name: string }[] = [];
  const newImageFiles = body['newImages[]'];

  function isFile(value:unknown): value is File {
    return typeof value === 'object' && value !== null && 'type' in value && 'name' in value;
  }

  const filesToUpload = Array.isArray(newImageFiles)
    ? newImageFiles.filter(isFile)
    : isFile(newImageFiles)
      ? [newImageFiles]
      : [];

  if (filesToUpload.length > 0) {
    uploadedNewImages = (
      await uploadFiles(filesToUpload, 'productImages')
    ).map((img: { public_id: string; name: string }) => ({
      public_id: img.public_id,
      name: img.name || '',
    }));
  }

  // Step 4: Combine retained + new
  const retainedImages =
    existing.images?.filter((img) => retainedPublicIds.includes(img.public_id)) || [];
  const updatedImages = [...retainedImages, ...uploadedNewImages];

  // Step 5: Prepare and validate product data
  const productData = {
    supplierId: data.supplierId,
    vnuProductName: data.vnuProductName,
    productName: data.productName,
    moq: data.moq,
    productPattern: data.productPattern,
    mainCategory: data.mainCategory,
    type: data.type,
    color: data.color,
    subToneColor: data.subToneColor,
    salesRate: data.salesRate,
    purchaseRate: data.purchaseRate,
    size: data.size,
    jariBase: data.jariBase,
    // cordingBase: data.cordingBase,
    images: updatedImages,
  };

  const parsed = ProductUpdateSchema.safeParse(productData);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  // Step 6: Update product
  const product = await updateProduct(productId, parsed.data);

  return c.json({ message: 'Product updated', product });
}
);



// Get a single product by ID
productRoute.get('/get-one/:id', zValidator('param', GetProductRequest), authMiddleware(), async (c) => {

  const data = c.req.valid('param');

  const id = data.id;

  const product = await getProductById(id);
  if (!product) return c.json({ error: 'Product not found' }, 404);

  // If product has images, attach signed URLs
  if (product.images && Array.isArray(product.images)) {
    product.images = product.images.map((img) => ({
      ...img,
      signedUrl: getSignedImageUrl(img.public_id), // assuming 'publicId' exists on ProductImage
    }));
  }

  return c.json(product);
});


// Get all products with optional filters
productRoute.post('/get-all', zValidator('json', GetAllProductsRequest), authMiddleware(), async (c) => {
  try {
    const data = c.req.valid('json');

    const rawResult = await getAllProducts(data);

    const mappedData = Array.isArray(rawResult.data)
      ? rawResult.data.map((product) => ({
          ...product,
          productName: product.productName ?? null,
          vnuProductName: product.vnuProductName ?? null,
          moq: product.moq ?? null,
          mainCategory: product.mainCategory ?? undefined,
          productPattern: product.productPattern ?? undefined,
          type: product.type ?? undefined,
          color: product.color ?? undefined,
          subMetallicColor: product.subMetallicColor ?? undefined,
          subToneColor: product.subToneColor ?? undefined,
          size: product.size ?? undefined,
          jariBase: product.jariBase ?? undefined,
          images: Array.isArray(product.images)
            ? product.images.map((img) => ({
                ...img,
                signedUrl: getSignedImageUrl(img.public_id),
              }))
            : undefined,
        }))
      : [];

    const result: GetAllProductsResponse = {
      ...rawResult,
      data: mappedData,
    };

    return c.json(result);
  } catch (err) {
    console.error('Error in /get-all:', err);
    return c.json({ error: 'Internal server error', details: err }, 500);
  }
});


// Delete a product by ID
productRoute.delete('/delete/:id', zValidator('param', DeleteProductRequest), authMiddleware(), async (c) => {

  const data = c.req.valid('param');

  const id = data.id;

  const product = await getProductById(id);
  if (!product) return c.json({ error: 'Product not found' }, 404);

  if (product.images?.length) {
    for (const img of product.images) {
      await deleteImageFromCloudinary(img.public_id);
    }
  }

  await deleteProduct(id);
  return c.json({ message: 'Product deleted' });
});
