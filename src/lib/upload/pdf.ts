import { v2 as cloudinary } from 'cloudinary';
import { Buffer } from 'buffer';
import { env } from 'process';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export interface UploadedPdf {
  public_id: string;
  name: string;
  url: string;
}

/**
 * Remove file extension from filename
 */
function getFileBaseName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}

/**
 * Upload a single PDF file to Cloudinary
 */
export async function uploadPdfToCloudinary(file: File, folder = 'pdfs'): Promise<UploadedPdf> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const originalName = file.name || `pdf_${Date.now()}`;
  const baseName = getFileBaseName(originalName);
  const timestampedPublicId = `${baseName}_${Date.now()}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw', // PDFs are raw files
        folder,
        public_id: timestampedPublicId,
        format: 'pdf',
        type: 'upload',
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({
          public_id: result.public_id,
          name: originalName,
          url: result.secure_url,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Upload multiple PDFs
 */
export async function uploadMultiplePdfsToCloudinary(files: File[] | File | undefined, folder = 'pdfs'): Promise<UploadedPdf[]> {
  const uploads: UploadedPdf[] = [];
  if (!files) return uploads;

  const fileArray = Array.isArray(files) ? files : [files];

  for (const file of fileArray) {
    if (
      !(file instanceof File) ||
      file.type !== 'application/pdf' ||
      !file.name.toLowerCase().endsWith('.pdf') ||
      file.size <= 0
    ) continue;

    const uploaded = await uploadPdfToCloudinary(file, folder);
    uploads.push(uploaded);
  }

  return uploads;
}

/**
 * Delete PDF from Cloudinary by public_id
 */
export async function deletePdfFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch (error) {
    console.error('Cloudinary PDF delete error:', error);
    throw error;
  }
}

/**
 * Generate signed URL for secure access to PDF (expires in 1.5 hours by default)
 */
export function getSignedPdfUrl(publicId: string, expiresInSeconds = 5400): string {
  if (!publicId) throw new Error('Public ID is required to generate signed URL');

  const timestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;

  return cloudinary.url(publicId, {
    sign_url: true,
    secure: true,
    resource_type: 'raw',
    type: 'upload',
    timestamp,
  });
}

/**
 * Generate URL that forces browser to download the PDF file
 */
export function getPdfDownloadUrl(publicId: string): string {
  if (!publicId) throw new Error('Public ID is required to generate download URL');

  const expireInSeconds = 3600; // 1 hour
  const timestamp = Math.floor(Date.now() / 1000) + expireInSeconds;

  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'raw',
    flags: 'attachment',
    sign_url: true,
    expires_at: timestamp,
  });
}
