import { CreateProductRequestType, GetAllProductsRequestType, GetAllProductsResponse, UpdateProductRequestType } from '@/lib/product/type';
import { ProductData } from '@/types/product';
import { ApiDelete, ApiGet, ApiPost, ApiPostFormData, ApiPutFormData } from './api-helper';

// Create product function -> done 
export const createProduct = async (data: CreateProductRequestType)=> {
  
  const formData = new FormData();
  
  // supplier
  formData.append('supplierId', data.supplierId);

  // Add required fields
  formData.append('vnuProductName',data.vnuProductName || '');
  formData.append('productName', data.productName || '');
  formData.append('moq', data.moq || '');
  
  // Always include these fields, even if they're empty strings
  formData.append('type', data.type || '');
  formData.append('color', data.color || '');
  formData.append('subToneColor', data.subToneColor || '');
  formData.append('subMetallicColor', data.subMetallicColor || '');
  formData.append('size', data.size || '');
  
  // rates
  formData.append('purchaseRate', data.purchaseRate || '');
  formData.append('salesRate', data.salesRate || '');

  // Add arrays as comma-separated strings
  formData.append('productPattern', data.productPattern ? data.productPattern.join(',') : '');
  formData.append('jariBase', data.jariBase ? data.jariBase.join(',') : '');
  formData.append('mainCategory', data.mainCategory ? data.mainCategory.join(',') : '');

  // Add image files correctly
  if (data['images[]'] && Array.isArray(data['images[]'])) {
    data['images[]'].forEach((file: File) => {
      formData.append('images[]', file); // Just append the file directly
    });
  }
  
  return await ApiPostFormData('/product/create', formData, {}, true);
};

// Update product function -> done  
export const updateProduct = async (productId: string, data: UpdateProductRequestType) => {
  
  const formData = new FormData();
  
  // supplier
  formData.append('supplierId', data.supplierId);

  // Add required fields
  formData.append('vnuProductName',data.vnuProductName || '');
  formData.append('productName', data.productName || '');
  formData.append('moq', data.moq || '');
  
  // Always include these fields, even if they're empty strings
  formData.append('type', data.type || '');
  formData.append('color', data.color || '');
  formData.append('subToneColor', data.subToneColor || '');
  formData.append('subMetallicColor', data.subMetallicColor || '');
  formData.append('size', data.size || '');
  
  // rates
  formData.append('purchaseRate', data.purchaseRate || '');
  formData.append('salesRate', data.salesRate || '');

  // Add arrays as comma-separated strings
  formData.append('productPattern', data.productPattern ? data.productPattern.join(',') : '');
  formData.append('jariBase', data.jariBase ? data.jariBase.join(',') : '');
  formData.append('mainCategory', data.mainCategory ? data.mainCategory.join(',') : '');
  
  if (data.existingImages) {
    formData.append('existingImages', data.existingImages.join(','));
  }

  // Add product ID
  formData.append('productId', productId);
  
  // Add new image files
  if (data['newImages[]'] && Array.isArray(data['newImages[]'])) {
    data['newImages[]'].forEach((file) => {
      if (file) formData.append('newImages[]', file);
    });
  }
  
  return await ApiPutFormData('/product/update', formData,{} ,true);
};

// get all products function -> done
export const getAllProducts = async (data: GetAllProductsRequestType): Promise<GetAllProductsResponse> => {
  const config = {
    limit: data.limit,
    offset: data.offset,
    filters: {
      ...data.filters,
    },
    search: data.search,
  };

  const response = await ApiPost<GetAllProductsResponse>('/product/get-all', config, {}, true);

  return response;
};

// get product by ID function -> done 
export const getProductById = async (id: string): Promise<ProductData> => {
  return await ApiGet<ProductData>(`/product/get-one/${id}`, {}, true);
};

export const deleteProduct = async (productId: string) => {
  return await ApiDelete(`/product/delete/${productId}`, {}, true);
};
