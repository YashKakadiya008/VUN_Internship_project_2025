import { OrderAdd, OrderInsert } from "@/db/type";
import { CreateOrderRequestType, GetAllIdNameResponse, OrderWithCustomerAndAddress, UpdateOrderRequestType } from "@/lib/order/type";
import { ApiDelete, ApiGet, ApiPost, ApiPostFormData, ApiPutFormData } from "./api-helper";

// create order
export const createOrder = async (data: CreateOrderRequestType) => {

  // convert in to form data
  const formData = new FormData();
  if (data.customerId) formData.append('customerId', data.customerId);
  if (data.supplierId) formData.append('supplierId', data.supplierId);
  if (data.productName) formData.append('productName', data.productName);
  if (data.type) formData.append('type', data.type);
  if (data.sample) formData.append('sample', data.sample);
  if (data.stage) formData.append('stage', data.stage);
  if (data.description) formData.append('description', data.description);
  if (data.targetDate) formData.append('targetDate', data.targetDate);
  if (data['images[]'] && Array.isArray(data['images[]'])) {
    data['images[]'].forEach((file) => {
      if (file !== undefined) {
        formData.append('images[]', file);
      }
    });
  }


  return await ApiPostFormData<OrderInsert>('/order/create', formData, {}, true);
}


// insert order items       
export const insertOrderItems = async (data: OrderInsert) => {
  return await ApiPost<OrderInsert>('/order/insert-items', data, {}, true);
}

// update order
export const updateOrder = async (data: UpdateOrderRequestType) => {

  // convert in to form data
  const formData = new FormData();
  if (data.orderId) formData.append('orderId', data.orderId);
  if (data.customerId) formData.append('customerId', data.customerId);
  if (data.supplierId) formData.append('supplierId', data.supplierId);

  if (data.productName) formData.append('productName', data.productName);
  if (data.type) formData.append('type', data.type);
  if (data.sample) formData.append('sample', data.sample);
  if (data.stage) formData.append('stage', data.stage);
  if (data.description) formData.append('description', data.description);
  if (data.targetDate) formData.append('targetDate', data.targetDate);
  if (data['images[]'] && Array.isArray(data['images[]'])) {
    data['images[]'].forEach((file) => {
      if (file !== undefined) {
        formData.append('images[]', file);
      }
    });
  }

  if (data.existingImages && Array.isArray(data.existingImages)) {
    formData.append('existingImages', data.existingImages.join(','));
  }

  return await ApiPutFormData<OrderInsert>('/order/update', formData, {}, true);
}

// get order by ID
export const getOrderById = async (orderId: string) => {
  return await ApiGet<OrderInsert>(`/order/get-one/${orderId}`, {}, true);
}

// get all customers
export const getAllCustomersIdAndName = async () => {
  return await ApiGet<GetAllIdNameResponse>('/order/get-customers', {}, true);
}

// get all suppliers
export const getAllSuppliersIdAndName = async () => {
  return await ApiGet<GetAllIdNameResponse>('/order/get-suppliers', {}, true);
}

// get orders by customer ID
export const getAllOrdersByCustomerId = async (customerId: string) => {
  return await ApiGet<OrderAdd[]>(`/order/get-by-customer/${customerId}`, {}, true);
}

// get all orders by supplier ID
export const getAllOrdersBySupplierId = async (supplierId: string) => {
  return await ApiGet<OrderWithCustomerAndAddress[]>(`/order/get-by-supplier/${supplierId}`, {}, true);
}

export const deleteOrder = async (orderId: string) => {
  return await ApiDelete(`/order/delete/${orderId}`, {}, true);
};
