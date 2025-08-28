// Adjust based on your API setup
import { CreateCustomerRequestType, GellAllAreaResponse, GetAllCustomersRequestType, GetAllCustomersResponse, UpdateCustomerRequestType } from "@/lib/customer/type";
import { DocumentType } from "@/types";
import { ApiDelete, ApiGet, ApiPost, ApiPostFormData, ApiPutFormData } from "./api-helper";

export const createCustomer = async (
  data: CreateCustomerRequestType,
  files: (File | DocumentType)[],
  galleryImages: { file: File; buffer: string; note?: string }[]
) => {
  const formData = new FormData();

  // Add basic fields
  if (data.companyName) formData.append("companyName", data.companyName);
  if (data.customerName) formData.append("customerName", data.customerName);
  if (data.reference) formData.append("reference", data.reference);
  if (data.mobileNo) formData.append("mobileNo", data.mobileNo);
  if (data.gstNo) formData.append("gstNo", data.gstNo);
  if (data.floor) formData.append("floor", data.floor);
  if (data.plotNo) formData.append("plotNo", data.plotNo);
  if (data.societyName) formData.append("societyName", data.societyName);
  if (data.lane) formData.append("lane", data.lane);
  if (data.address) formData.append("address", data.address);
  if (data.area) formData.append("area", data.area);
  if (data.city) formData.append("city", data.city);
  if (data.state) formData.append("state", data.state);
  if (data.pincode) formData.append("pincode", data.pincode);
  if (data.locationLink) formData.append("locationLink", data.locationLink);
  if (data.range) formData.append("range", data.range);
  if (data.usageValueMonthly) formData.append("usageValueMonthly", data.usageValueMonthly);
  if (data.paymentCycle) formData.append("paymentCycle", data.paymentCycle);
  if (data.openForCollab) formData.append("openForCollab", data.openForCollab);
  if (data.notes) formData.append("notes", data.notes);
  if (data.machineType) formData.append("machineType", JSON.stringify(data.machineType));



  // Add array fields as comma-separated strings
  if (data.workType?.length) formData.append("workType", data.workType.join(","));
  // if (data.machineType?.length) formData.append("machineType", data.machineType.join(","));
  if (data.making?.length) formData.append("making", data.making.join(","));
  if (data.materialUsage?.length) formData.append("materialUsage", data.materialUsage.join(","));
  if (data.type?.length) formData.append("type", data.type.join(","));
  if (data.color?.length) formData.append("color", data.color.join(","));
  if (data.subMetallicColor?.length) formData.append("subMetallicColor", data.subMetallicColor.join(","));
  if (data.subToneColor?.length) formData.append("subToneColor", data.subToneColor.join(","));
  if (data.taste?.length) formData.append("taste", data.taste.join(","));
  if (data.size?.length) formData.append("size", data.size.join(","));
  if (data.customerSaleChoice?.length) formData.append("customerSaleChoice", data.customerSaleChoice.join(","));
  if (data.customerSaleMethod?.length) formData.append("customerSaleMethod", data.customerSaleMethod.join(","));




  // Add document files
  files.forEach((file) => {
    if (file instanceof File) {
      formData.append("files[]", file);
    }
  });

  // Add gallery images
  galleryImages.forEach((img) => {
    formData.append("productImages[]", img.file);
    if (img.note) formData.append(`productImageNotes`, img.note);
  });



  return await ApiPostFormData("/customer/create", formData, {}, true);
};

export const updateCustomer = async (
  customerId: string,
  data: UpdateCustomerRequestType,
  files: (File | DocumentType)[],
  galleryImages: { file: File; buffer: string; note?: string }[],
  existingFiles: string[],
  existingImages: string[]
) => {
  const formData = new FormData();

  formData.append("customerId", customerId);
  if (data.companyName) formData.append("companyName", data.companyName);
  if (data.customerName) formData.append("customerName", data.customerName);
  if (data.reference) formData.append("reference", data.reference);
  if (data.mobileNo) formData.append("mobileNo", data.mobileNo);
  if (data.gstNo) formData.append("gstNo", data.gstNo);
  if (data.floor) formData.append("floor", data.floor);
  if (data.plotNo) formData.append("plotNo", data.plotNo);
  if (data.societyName) formData.append("societyName", data.societyName);
  if (data.lane) formData.append("lane", data.lane);
  if (data.address) formData.append("address", data.address);
  if (data.area) formData.append("area", data.area);
  if (data.city) formData.append("city", data.city);
  if (data.state) formData.append("state", data.state);
  if (data.pincode) formData.append("pincode", data.pincode);
  if (data.locationLink) formData.append("locationLink", data.locationLink);
  if (data.range) formData.append("range", data.range);
  if (data.usageValueMonthly) formData.append("usageValueMonthly", data.usageValueMonthly);
  if (data.paymentCycle) formData.append("paymentCycle", data.paymentCycle);
  if (data.openForCollab) formData.append("openForCollab", data.openForCollab);
  if (data.notes) formData.append("notes", data.notes);

  // Add array fields as comma-separated strings
  if (data.workType?.length) formData.append("workType", data.workType.join(","));
  if (data.machineType?.length) formData.append("machineType", data.machineType.join(","));
  if (data.making?.length) formData.append("making", data.making.join(","));
  if (data.materialUsage?.length) formData.append("materialUsage", data.materialUsage.join(","));
  if (data.type?.length) formData.append("type", data.type.join(","));
  if (data.color?.length) formData.append("color", data.color.join(","));
  if (data.subToneColor?.length) formData.append("subToneColor", data.subToneColor.join(","));
  if (data.subMetallicColor?.length) formData.append("subMetallicColor", data.subMetallicColor.join(","));
  if (data.taste?.length) formData.append("taste", data.taste.join(","));
  if (data.size?.length) formData.append("size", data.size.join(","));
  if (data.customerSaleChoice?.length) formData.append("customerSaleChoice", data.customerSaleChoice.join(","));
  if (data.customerSaleMethod?.length) formData.append("customerSaleMethod", data.customerSaleMethod.join(","));

  // Add existing files and images
  if (existingFiles.length) formData.append("existingFiles", existingFiles.join(","));
  if (existingImages.length) formData.append("existingProductImages", existingImages.join(","));

  // Add new document files
  files.forEach((file) => {
    if (file instanceof File) {
      formData.append("files[]", file);
    }
  });

  // Add new gallery images
  galleryImages.forEach((img, idx) => {
    if (img.file.size > 0) { // Only append new images
      formData.append("productImages[]", img.file);
      if (img.note) formData.append(`productImageNotes[${idx}]`, img.note);
    }
  });

  return await ApiPutFormData("/customer/update", formData, {}, true);
};

import { CustomerData } from "@/types/customerData";

export const getCustomerById = async (id: string): Promise<CustomerData> => {

  return await ApiGet<CustomerData>(`/customer/get-one/${id}`, {}, true);
};

// getAllCustomers function
export const getAllCustomers = async (data: GetAllCustomersRequestType): Promise<GetAllCustomersResponse> => {

  const config = {
    limit: data.limit,
    offset: data.offset,
    filters: {
      ...data.filters,
    },
    search: data.search,
  };


  return await ApiPost<GetAllCustomersResponse>("/customer/get-all", config, {}, true);

}

export const deleteCustomer = async (customerId: string) => {
  return await ApiDelete(`/customer/delete/${customerId}`, {}, true);
};

export const getAllArea = async () => {
  return await ApiGet<GellAllAreaResponse>("/customer/get-all-area", {}, true);
};