import { DocumentType } from "./index";

export interface CustomerData {
  id: string;
  companyName?: string;
  customerName: string;
  reference?: string;
  mobileNo?: string;
  gstNo?: string;
  address?: {
    floor?: string;
    plotNo?: string;
    societyName?: string;
    lane?: string;
    address?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
    locationLink?: string;
  };
  workType?: string[];
  machineType?: { label: string; value?: string }[];
  making?: string[];
  materialUsage?: string[];
  type?: string[];
  color?: string[];
  subMetallicColor?: string[];
  subToneColor?: string[];
  taste?: string[];
  size?: string[];
  range?: string;
  usageValueMonthly?: string;
  paymentCycle?: string;
  productImages?: {
    name: string;
    signedUrl: string;
    note?: string;
    public_id: string;
  }[];
  openForCollab?: 'yes' | 'no';
  customerSaleChoice?: string[];
  customerSaleMethod?: string[];
  notes?: string;
  files?: DocumentType[];
}
