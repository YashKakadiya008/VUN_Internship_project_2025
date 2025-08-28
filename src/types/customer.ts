import { DocumentType } from "@/types/index";
import { z } from "zod";

export const customerOrderSchema = z.object({
    id: z.string().optional(),
    productName: z.string().nonempty("Product Name is required"),
    type: z.string().nonempty("Type is required"),
    stage: z.string().nonempty("Stage is required"),
    supplier: z.string().nonempty("Supplier is required"),
    description: z.string().optional(),
    targetDate: z.string().nonempty("Target Date is required"),
})

export type CustomerOrderField = z.infer<typeof customerOrderSchema>

export type CustomerOrder = {
    id: string;
    avatar: string | null;
    productName: string;
    type: string;
    stage: string;
    supplier: string;
    description: string;
    targetDate: string;
}

const cloudinaryDocumentSchema = z.object({
  name: z.string(),
  public_id: z.string(),
  signedUrl: z.string().url(),
});

const indianMobileRegex = /^[6-9]\d{9}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

export const addCustomerSchema = z.object({
    companyName: z.string().optional(),
    customerName: z.string().min(1, "Customer name is required"),
    reference: z.string().optional(),
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
    workType: z.array(z.string()).optional(),
    machineType: z.array(z.object({ label: z.string(), value: z.string().optional(), })),
    making: z.array(z.string()).optional(),
    materialUsage: z.array(z.string()).optional(),
    type: z.array(z.string()).optional(),
    color: z.array(z.string()).optional(),
    subMetallicColor: z.array(z.string()).optional(),
    subToneColor: z.array(z.string()).optional(),
    taste: z.array(z.string()).optional(),
    size: z.array(z.string()).optional(),
    range: z.string().optional(),
    usageValueMonthly: z.string().optional(),
    paymentCycle: z.string().optional(),
    customerProductGallery: z
        .array(
            z.object({
                file: z.any(),
                note: z.string().optional(),
            })
        )
        .optional(),
    traditionalSariServer: z.string().optional(),
    openForCollab: z.enum(['yes', 'no']).optional(),
    customerSaleChoice: z.array(z.string()).optional(),
    customerSaleMethod: z.array(z.string()).optional(),
    notes: z.string().optional().refine((val) => !val || val.length <= 500, { message: "Notes must be less than 500 characters" }),
     document: z
    .array(
      z.union([
        DocumentType,
        z.instanceof(File),
        cloudinaryDocumentSchema, // 👈 added this
      ])
    )
    .optional(),
});

export type AddCustomerField = z.infer<typeof addCustomerSchema>

export const addImageSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    
    note: z.string().optional(),
})

export type AddImageField = z.infer<typeof addImageSchema>




