import { v2 as cloudinary } from 'cloudinary';
import { Buffer } from 'buffer';
import { env } from 'process';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export interface ProductImage {
  public_id: string;
  name: string;  // filename without extension
}

// Convert File or string to base64 string
export async function getBase64FromFile(file: File | string): Promise<string> {
  if (file instanceof File) {
    // For File objects, use arrayBuffer and convert to Buffer
    const buffer = await file.arrayBuffer();
    return Buffer.from(new Uint8Array(buffer)).toString('base64');
  } else if (typeof file === 'string') {
    // For strings, use TextEncoder to convert to Uint8Array
    const uint8Array = new TextEncoder().encode(file);
    return Buffer.from(uint8Array).toString('base64');
  } else {
    throw new Error('Invalid file type');
  }
}

// Upload a single image file to Cloudinary with a clean public_id (no extension + timestamp)
export async function uploadImageToCloudinary(
  file: File | string,
  publicId: string,
  folder: string
): Promise<ProductImage> {
  try {
    const base64 = await getBase64FromFile(file);
    const dataUri = `data:image/jpeg;base64,${base64}`;

    // Get filename without extension
    const originalFileName = file instanceof File ? file.name : publicId;
    const nameWithoutExtension = originalFileName.replace(/\.[^/.]+$/, '');


    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `${folder}/images`,
      resource_type: 'image',
      overwrite: true,
      public_id: nameWithoutExtension,  // Clean public_id (without extension)
      filename_override: nameWithoutExtension, // Ensure the filename is set to publicId
    });

    return {
      public_id: result.public_id,     // Cloudinary public_id (clean)
      name: nameWithoutExtension,      // filename without extension
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

// Delete image from Cloudinary by public_id
export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

// Upload multiple files, return array of ProductImage with clean public_id and filenames without extension
export async function uploadFiles(
  files: File[] | File | undefined,
  folder: string
): Promise<ProductImage[]> {
  const uploads: ProductImage[] = [];
  if (!files) return uploads;

  const filesArr = Array.isArray(files) ? files : [files];

  for (const file of filesArr) {
    if (!file || typeof file === 'string') continue;

    const originalName = file.name ?? `img_${Date.now()}`;
    const cleanName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension
    const timestamp = Date.now();
    const cleanPublicId = `${cleanName}_${timestamp}`; // unique public_id

    const uploaded = await uploadImageToCloudinary(file, cleanPublicId, folder);


    uploads.push({
      public_id: uploaded.public_id,
      name: uploaded.name,  // filename without extension (already processed in uploadImageToCloudinary)
    });
  }

  return uploads;
}

// Generate signed URL for image with expiry in seconds (default 1.5 hours)
export function getSignedImageUrl(publicId: string): string {
  if (!publicId) {
    throw new Error('Public ID is required to generate a signed URL');
  }

  const expiresInSeconds = 60 * 60; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expirationTimestamp = currentTimestamp + expiresInSeconds;

  const signedUrl = cloudinary.url(publicId, {
    sign_url: true,
    secure: true,
    resource_type: 'image',
    type: 'upload',
    timestamp: expirationTimestamp,
  });

  return signedUrl;
}