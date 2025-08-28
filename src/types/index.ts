import { z } from "zod"

export enum DocumentTypeEnum {
    image = 'image',
    pdf = 'pdf'
}

export const DocumentType = z.object({
    id: z.string().nonempty(),
    name: z.string().nonempty(),
    note: z.string().optional(),   
    singedUrl: z.string(),
    public_id: z.string().optional(),
})
export type DocumentType = z.infer<typeof DocumentType>