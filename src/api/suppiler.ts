import { PAGE_LIMIT } from "@/lib/constants";
import { CreateSupplierRequestType, SupplierUpdateData } from "@/lib/supplier/type";
import { ApiDelete, ApiGet, ApiPost, ApiPostFormData } from "./api-helper";

// create supplier
export const createSupplier = async (data: CreateSupplierRequestType) => {

    const formData = new FormData();

    // Add basic fields
    if (data.companyName) formData.append('companyName', data.companyName);
    if (data.supplierName) formData.append('supplierName', data.supplierName);
    if (data.mobileNo) formData.append('mobileNo', data.mobileNo);
    if (data.gstNo) formData.append('gstNo', data.gstNo);
    if (data.floor) formData.append('floor', data.floor);
    if (data.plotNo) formData.append('plotNo', data.plotNo);
    if (data.societyName) formData.append('societyName', data.societyName);
    if (data.lane) formData.append('lane', data.lane);
    if (data.address) formData.append('address', data.address);
    if (data.area) formData.append('area', data.area);
    if (data.city) formData.append('city', data.city);
    if (data.state) formData.append('state', data.state);
    if (data.pincode) formData.append('pincode', data.pincode);
    if (data.locationLink) formData.append('locationLink', data.locationLink);

    if (data.workType) {
        if (Array.isArray(data.workType)) {
            formData.append('workType', data.workType.join(','));
        } else {
            formData.append('workType', data.workType);
        }
    }

    if (data.productPattern && Array.isArray(data.productPattern)) {
        formData.append('productPattern', data.productPattern.join(','));
    }
    if (data.supplierMachineType && Array.isArray(data.supplierMachineType)) {
        formData.append('supplierMachineType', data.supplierMachineType.join(','));
    }
    if (data.mainCategory && Array.isArray(data.mainCategory)) {
        formData.append('mainCategory', data.mainCategory.join(','));
    }
    if (data.jariBase && Array.isArray(data.jariBase)) {
        formData.append('jariBase', data.jariBase.join(','));
    }
    if (data.cordingBase && Array.isArray(data.cordingBase)) {
        formData.append('cordingBase', data.cordingBase.join(','));
    }
    if (data.type && Array.isArray(data.type)) {
        formData.append('type', data.type.join(','));
    }
    if (data.stock && Array.isArray(data.stock)) {
        formData.append('stock', data.stock.join(','));
    }
    if (data.productionCapacity && Array.isArray(data.productionCapacity)) {
        formData.append('productionCapacity', data.productionCapacity.join(','));
    }
    if (data.notes) formData.append('notes', data.notes);

    // notes -> images, files
    if (data.fileNotes && Array.isArray(data.fileNotes)) {
        formData.append('fileNotes', data.fileNotes.join(','));
    }
    if (data.imageNotes && Array.isArray(data.imageNotes)) {
        formData.append('imageNotes', data.imageNotes.join(','));
    }

    // Add image files correctly
    if (data['images[]'] && Array.isArray(data['images[]'])) {
        data['images[]'].forEach((file) => {
            if (file) formData.append('images[]', file);
        });
    }

    // Add files
    if (data['files[]'] && Array.isArray(data['files[]'])) {
        data['files[]'].forEach((file) => {
            if (file) formData.append('files[]', file);
        });
    }

    return await ApiPostFormData('/supplier/create', formData, {}, true);
}

// get supplier
export const getoneSupplier = async (id: string): Promise<SupplierType> => {
    return await ApiGet<SupplierType>(`/supplier/get-one/${id}`, {}, true);
}

export interface GetAllSuppliersRequest {
    limit?: number;
    offset?: number;
    filters?: {
        workType?: string[];
        productPattern?: string[];
        supplierMachineType?: string[];
        mainCategory?: string[];
        jariBase?: string[];
        cordingBase?: string[];
        type?: string[];
        stock?: string[];
        productionCapacity?: string[];
    };
    search?: string;
}

export type SupplierType = {
    supplierId: string;
    addressId: string;
    companyName: string | null;
    supplierName: string | null;
    mobileNo: string | null;
    gstNo: string | null;
    workType: string[];
    productPattern: string[];
    supplierMachineType: string[];
    mainCategory: string[];
    jariBase: string[];
    cordingBase: string[];
    type: string[];
    stock: string[];
    productionCapacity: string[];
    notes: string | null;
    files: { id: string; name: string, note: string | null, signedUrl: string }[];
    images: { id: string; name: string, note: string | null, signedUrl: string }[];
    address: {
        floor: string | null;
        plotNo: string | null;
        societyName: string | null;
        lane: string | null;
        address: string | null;
        area: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        locationLink: string | null;
    }
    createdAt: Date;
    updatedAt: Date;
}

export type GetAllSuppliersResponse = {
    data: SupplierType[];
    total: number;
    limit: number;
    search: string;
    offset: number;
}

export const getAllSuppliers = async (data: GetAllSuppliersRequest): Promise<GetAllSuppliersResponse> => {
    const config = {
        limit: data.limit || PAGE_LIMIT,
        offset: data.offset || 0,
        filters: data.filters,
        search: data.search 
    };
    return await ApiPost<GetAllSuppliersResponse>('/supplier/get-all', config, {}, true);
};

// update supplier
export const updateSupplier = async (id: string, data: SupplierUpdateData) => {
    const formData = new FormData();

    // Add basic fields
    if (data.companyName) formData.append('companyName', data.companyName);
    if (data.supplierName) formData.append('supplierName', data.supplierName);
    if (data.mobileNo) formData.append('mobileNo', data.mobileNo);
    if (data.gstNo) formData.append('gstNo', data.gstNo);
    if (data.floor) formData.append('floor', data.floor);
    if (data.plotNo) formData.append('plotNo', data.plotNo);
    if (data.societyName) formData.append('societyName', data.societyName);
    if (data.lane) formData.append('lane', data.lane);
    if (data.address) formData.append('address', data.address);
    if (data.area) formData.append('area', data.area);
    if (data.city) formData.append('city', data.city);
    if (data.state) formData.append('state', data.state);
    if (data.pincode) formData.append('pincode', data.pincode);
    if (data.locationLink) formData.append('locationLink', data.locationLink);

    // Handle workType - can be string or string[]
    if (data.workType) {
        if (Array.isArray(data.workType)) {
            formData.append('workType', data.workType.join(','));
        } else {
            formData.append('workType', data.workType);
        }
    }

    if (data.productPattern && Array.isArray(data.productPattern)) {
        formData.append('productPattern', data.productPattern.join(','));
    }
    if (data.supplierMachineType && Array.isArray(data.supplierMachineType)) {
        formData.append('supplierMachineType', data.supplierMachineType.join(','));
    }
    if (data.mainCategory && Array.isArray(data.mainCategory)) {
        formData.append('mainCategory', data.mainCategory.join(','));
    }
    if (data.jariBase && Array.isArray(data.jariBase)) {
        formData.append('jariBase', data.jariBase.join(','));
    }
    if (data.cordingBase && Array.isArray(data.cordingBase)) {
        formData.append('cordingBase', data.cordingBase.join(','));
    }
    if (data.type && Array.isArray(data.type)) {
        formData.append('type', data.type.join(','));
    }
    if (data.stock && Array.isArray(data.stock)) {
        formData.append('stock', data.stock.join(','));
    }
    if (data.productionCapacity && Array.isArray(data.productionCapacity)) {
        formData.append('productionCapacity', data.productionCapacity.join(','));
    }
    if (data.notes) formData.append('notes', data.notes);

    // Add existing images and files IDs
    if (data.existingImages && Array.isArray(data.existingImages)) {
        data.existingImages.forEach((id) => {
            formData.append('existingImages', id);
        });
    }
    if (data.existingFiles && Array.isArray(data.existingFiles)) {
        data.existingFiles.forEach((id) => {
            formData.append('existingFiles', id);
        });
    }

    // Add image files
    if (data['images[]'] && Array.isArray(data['images[]'])) {
        data['images[]'].forEach((file) => {
            if (file) formData.append('images[]', file);
        });
    }

    // Add file notes for images
    if (data.imageNotes && Array.isArray(data.imageNotes)) {
        data.imageNotes.forEach((note) => {
            formData.append('imageNotes[]', note || '');
        });
    }

    // Add document files
    if (data['files[]'] && Array.isArray(data['files[]'])) {
        data['files[]'].forEach((file) => {
            if (file) formData.append('files[]', file);
        });
    }

    // Add file notes for documents
    if (data.fileNotes && Array.isArray(data.fileNotes)) {
        data.fileNotes.forEach((note) => {
            formData.append('fileNotes[]', note || '');
        });
    }

    return await ApiPostFormData(`/supplier/update/${id}`, formData, {}, true);
}


export const deleteSupplier = async (supplierId: string) => {
    return await ApiDelete(`/supplier/delete/${supplierId}`, {}, true);
};

