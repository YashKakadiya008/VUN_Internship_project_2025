import { DocumentType } from "@/types";
import { z } from "zod";

export const supplierOrderSchema = z.object({
    id: z.string().optional(),
    productName: z.string().nonempty("Product Name is required"),
    stage: z.string().nonempty("Stage is required"),
    description: z.string().nonempty("Description is required"),
    createdDate: z.string().nonempty("Created Date is required"),
})

export type SupplierOrderField = z.infer<typeof supplierOrderSchema>

export type SupplierOrder = {
    id: string;
    avatar: string | null;
    productName: string;
    stage: string;
    description: string;
    createdDate: string;
}

const indianMobileRegex = /^[6-9]\d{9}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

export const addSupplierSchema = z.object({
    companyName: z.string().optional(),
    supplierName: z.string().min(1, "Supplier name is required"),
    mobileNo: z.string().optional().refine((val) => !val || indianMobileRegex.test(val), { message: "Please enter a valid Indian mobile number" }),
    gstNo: z.string().optional().refine((val) => !val || gstRegex.test(val), { message: "Please enter a valid GST number (15 characters)" }),
    floor: z.string().optional(),
    plotNo: z.string().optional(),
    societyName: z.string().optional(),
    lane: z.string().optional(),
    address: z.string().optional(),
    area: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional().refine((val) => !val || pincodeRegex.test(val), { message: "Please enter a valid pincode" }),
    locationLink: z.string().optional().refine((val) => !val || z.string().url().safeParse(val).success, { message: "Please enter a valid URL" }),
    workType: z.string().optional(),
    productPattern: z.array(z.string()).optional(),
    supplierMachineType: z.array(z.string()).optional(),
    mainCategory: z.array(z.string()).optional(),
    jariBase: z.array(z.string()).optional(),
    cordingBase: z.array(z.string()).optional(),
    type: z.array(z.string()).optional(),
    stock: z.array(z.string()).optional(),
    productionCapacity: z.array(z.string()).optional(),
    notes: z.string().optional().refine((val) => !val || val.length <= 500, { message: "Notes must be less than 500 characters" }),
    document: z.array(z.union([DocumentType, z.instanceof(File)])).optional(),
});

export type AddSupplierField = z.infer<typeof addSupplierSchema>

export const addImageSchema = z.object({
    id: z.string().optional(),
    note: z.string().optional(),
})

export type AddImageField = z.infer<typeof addImageSchema>