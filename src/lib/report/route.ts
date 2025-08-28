import { getAllCustomersForReport, getCustomerByIdForReport } from '@/db/queries/customer';
import { getAllOrdersByOrderIdsForReport, getSalesByPagination, getSalesReportwithFilter } from '@/db/queries/order';
import { getAllSuppliersForReport } from '@/db/queries/supplier';
import { zValidator } from '@hono/zod-validator';
import { formatInTimeZone } from "date-fns-tz";
import ExcelJS from 'exceljs';
import { Hono } from 'hono';
import { streamText } from "hono/streaming";
import { authMiddleware } from '../middleware';
import {
    Address,
    CustomerFiltersSchema,
    DownloadExcelRequest,
    OrderIdListRequest,
    salesFilterSchema,
    salesPaginationSchame,
    SupplierFiltersSchema
} from './type';


export const reportRoute = new Hono();

// Helper function to format array fields as comma-separated strings
type LabelValue = { label: string; value: string };

const formatArrayField = (value: LabelValue[] | string[] | number[] | string | number | null | undefined): string => {
    if (!value) return '';

    if (Array.isArray(value)) {
        // Handle array of objects with label and value
        if (value.length > 0 && typeof value[0] === 'object' && 'label' in value[0] && 'value' in value[0]) {
            return (value as LabelValue[]).map(item => `${item.label}: ${item.value}`).join(', ');
        }
        // Handle regular arrays (string[] or number[])
        return value.join(', ');
    }

    return String(value);
};


// Customers Report
reportRoute.post(
    '/generate-customers-report',
    zValidator('json', CustomerFiltersSchema),
    authMiddleware(),
    async (c) => {
        try {

            const filters = c.req.valid('json');

            // Get timezone from header
            const timeZone = c.req.header('x-client-timezone') || 'Asia/Kolkata';


            // Query customers with all fields
            const customersQuery = await getAllCustomersForReport(filters);

            if (!customersQuery.length) {
                return c.json({ message: 'No customers found' }, 404);
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Customers Report');

            // Define all columns with appropriate widths
            worksheet.columns = [
                { header: 'Company Name', key: 'companyName', width: 25 },
                { header: 'Customer Name', key: 'customerName', width: 25 },
                { header: 'Mobile No', key: 'mobileNo', width: 15 },
                { header: 'Reference', key: 'reference', width: 15 },
                { header: 'Work Type', key: 'workType', width: 15 },
                { header: 'Machine Type', key: 'machineType', width: 20 },
                { header: 'Making', key: 'making', width: 20 },
                { header: 'Material Usage', key: 'materialUsage', width: 20 },
                { header: 'Type', key: 'type', width: 15 },
                { header: 'Color', key: 'color', width: 15 },
                { header: 'Sub Tone Color', key: 'subToneColor', width: 20 },
                { header: 'Sub Metallic Color', key: 'subMetallicColor', width: 20 },
                { header: 'Taste', key: 'taste', width: 15 },
                { header: 'Size', key: 'size', width: 15 },
                { header: 'Range', key: 'range', width: 15 },
                { header: 'Monthly Usage Value', key: 'usageValueMonthly', width: 20 },
                { header: 'Payment Cycle', key: 'paymentCycle', width: 15 },
                { header: 'Open for Collaboration', key: 'openForCollab', width: 20 },
                { header: 'Sale Choice', key: 'customerSaleChoice', width: 20 },
                { header: 'Sale Method', key: 'customerSaleMethod', width: 20 },
                { header: 'GST No', key: 'gstNo', width: 20 },
                { header: 'Notes', key: 'notes', width: 30 },

                // Address fields
                { header: 'Address', key: 'address', width: 40 },
                { header: 'Area', key: 'area', width: 20 },
                { header: 'City', key: 'city', width: 20 },
                { header: 'State', key: 'state', width: 20 },
                { header: 'Pincode', key: 'pincode', width: 15 },
                { header: 'Lane', key: 'lane', width: 20 },
                { header: 'Society Name', key: 'societyName', width: 25 },
                { header: 'Plot No', key: 'plotNo', width: 15 },
                { header: 'Floor', key: 'floor', width: 15 },
                { header: 'Location Link', key: 'locationLink', width: 40 },

                { header: 'Created At', key: 'createdAt', width: 20 },
            ];

            // Add data rows with proper formatting
            worksheet.addRows(
                customersQuery.map((c) => ({
                    companyName: c.companyName || '',
                    customerName: c.customerName || '',
                    mobileNo: c.mobileNo || '',
                    reference: c.reference || '',
                    workType: formatArrayField(c.workType),
                    machineType: formatArrayField(c.machineType),
                    making: formatArrayField(c.making),
                    materialUsage: formatArrayField(c.materialUsage),
                    type: formatArrayField(c.type),
                    color: formatArrayField(c.color),
                    subToneColor: formatArrayField(c.subToneColor),
                    subMetallicColor: formatArrayField(c.subMetallicColor),
                    taste: formatArrayField(c.taste),
                    size: formatArrayField(c.size),
                    range: formatArrayField(c.range),
                    usageValueMonthly: c.usageValueMonthly || '',
                    paymentCycle: formatArrayField(c.paymentCycle),
                    openForCollab: c.openForCollab ? 'Yes' : 'No',
                    customerSaleChoice: formatArrayField(c.customerSaleChoice),
                    customerSaleMethod: formatArrayField(c.customerSaleMethod),
                    gstNo: c.gstNo || '',
                    notes: c.notes || '',

                    // Address fields
                    address: c.address || '',
                    area: c.area || '',
                    city: c.city || '',
                    state: c.state || '',
                    pincode: c.pincode || '',
                    lane: c.lane || '',
                    societyName: c.societyName || '',
                    plotNo: c.plotNo || '',
                    floor: c.floor || '',
                    locationLink: c.locationLink || '',

                    // Format date with timezone
                    createdAt: formatInTimeZone(c.createdAt, timeZone, 'dd-MM-yyyy HH:mm:ss')
                }))
            );

            // Style the header row
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true
            };

            // Auto-size columns based on content
            worksheet.columns.forEach(column => {
                if (column.key) {
                    const headerLength = column.header ? column.header.length : 0;
                    const maxContentLength = Math.max(
                        ...customersQuery.map(row =>
                            String(row[column.key as keyof typeof customersQuery[0]] || '').length
                        )
                    );
                    column.width = Math.min(Math.max(headerLength, maxContentLength) + 2, 50); // Cap at 50 width
                }
            });

            // Generate and stream the Excel file
            return streamText(c, async (stream) => {
                c.header(
                    'Content-Type',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                );
                c.header('Content-Disposition', 'attachment; filename=customers-report.xlsx');

                stream.onAbort(() => {
                    console.log('Customers report stream aborted!');
                });

                const buffer = await workbook.xlsx.writeBuffer();
                await stream.write(new Uint8Array(buffer));
            });
        } catch (error) {
            console.error('Error in generate customers report', error);
            return c.json({ message: 'Error in generate customers report', cause: error }, 500);
        }
    }
);

// Single Customer Report
reportRoute.post(
    '/generate-customer-report/:customerId',
    zValidator('json', DownloadExcelRequest),
    authMiddleware(),
    async (c) => {
        try {
            const { customerId } = c.req.param();
            const timeZone = c.req.header('x-client-timezone') || 'Asia/Kolkata';

            const customerQuery = await getCustomerByIdForReport(customerId);


            if (!customerQuery.length) {
                return c.json({ message: 'Customer not found' }, 404);
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Customer Report');

            worksheet.columns = [
                { header: 'Company Name', key: 'companyName', width: 30 },
                { header: 'Customer Name', key: 'customerName', width: 30 },
                { header: 'Mobile No', key: 'mobileNo', width: 15 },
                { header: 'Reference', key: 'reference', width: 15 },
                { header: 'Work Type', key: 'workType', width: 15 },
                { header: 'Machine Type', key: 'machineType', width: 20 },
                { header: 'Making', key: 'making', width: 20 },
                { header: 'Material Usage', key: 'materialUsage', width: 20 },
                { header: 'Type', key: 'type', width: 15 },
                { header: 'Color', key: 'color', width: 15 },
                { header: 'Sub Tone Color', key: 'subToneColor', width: 20 },
                { header: 'Sub Metallic Color', key: 'subMetallicColor', width: 20 },
                { header: 'Taste', key: 'taste', width: 15 },
                { header: 'Size', key: 'size', width: 15 },
                { header: 'Range', key: 'range', width: 15 },
                { header: 'Monthly Usage Value', key: 'usageValueMonthly', width: 20 },
                { header: 'Payment Cycle', key: 'paymentCycle', width: 15 },
                { header: 'Open for Collaboration', key: 'openForCollab', width: 20 },
                { header: 'Sale Choice', key: 'customerSaleChoice', width: 20 },
                { header: 'Sale Method', key: 'customerSaleMethod', width: 20 },
                { header: 'GST No', key: 'gstNo', width: 20 },
                { header: 'Notes', key: 'notes', width: 30 },

                // Address fields
                { header: 'Address', key: 'address', width: 40 },
                { header: 'Area', key: 'area', width: 20 },
                { header: 'City', key: 'city', width: 20 },
                { header: 'State', key: 'state', width: 20 },
                { header: 'Pincode', key: 'pincode', width: 15 },
                { header: 'Lane', key: 'lane', width: 20 },
                { header: 'Society Name', key: 'societyName', width: 25 },
                { header: 'Plot No', key: 'plotNo', width: 15 },
                { header: 'Floor', key: 'floor', width: 15 },
                { header: 'Location Link', key: 'locationLink', width: 40 },

                { header: 'Created At', key: 'createdAt', width: 20 },
            ];

            worksheet.addRows(
                customerQuery.map((c) => ({
                    companyName: c.companyName || '',
                    customerName: c.customerName || '',
                    mobileNo: c.mobileNo || '',
                    reference: c.reference || '',
                    workType: formatArrayField(c.workType),
                    machineType: formatArrayField(c.machineType),
                    making: formatArrayField(c.making),
                    materialUsage: formatArrayField(c.materialUsage),
                    type: formatArrayField(c.type),
                    color: formatArrayField(c.color),
                    subToneColor: formatArrayField(c.subToneColor),
                    subMetallicColor: formatArrayField(c.subMetallicColor),
                    taste: formatArrayField(c.taste),
                    size: formatArrayField(c.size),
                    range: formatArrayField(c.range),
                    usageValueMonthly: c.usageValueMonthly || '',
                    paymentCycle: formatArrayField(c.paymentCycle),
                    openForCollab: c.openForCollab ? 'Yes' : 'No',
                    customerSaleChoice: formatArrayField(c.customerSaleChoice),
                    customerSaleMethod: formatArrayField(c.customerSaleMethod),
                    gstNo: c.gstNo || '',
                    notes: c.notes || '',

                    // Address fields
                    address: c.address || '',
                    area: c.area || '',
                    city: c.city || '',
                    state: c.state || '',
                    pincode: c.pincode || '',
                    lane: c.lane || '',
                    societyName: c.societyName || '',
                    plotNo: c.plotNo || '',
                    floor: c.floor || '',
                    locationLink: c.locationLink || '',

                    // Format date with timezone
                    createdAt: formatInTimeZone(c.createdAt, timeZone, 'dd-MM-yyyy HH:mm:ss')
                }))
            );

            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.alignment = { horizontal: 'center' };

            return streamText(c, async (stream) => {
                c.header(
                    'Content-Type',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                );
                c.header('Content-Disposition', `attachment; filename=customer-${customerId}-report.xlsx`);

                stream.onAbort(() => {
                    console.log('Single customer report stream aborted!');
                });

                const buffer = await workbook.xlsx.writeBuffer();
                await stream.write(new Uint8Array(buffer));
            });
        } catch (error) {
            console.error('Error in generate customer report', error);
            return c.json({ message: 'Error in generate customer report', cause: error }, 500);
        }
    }
);

// Suppliers Report
reportRoute.post(
    '/generate-suppliers-report',
    zValidator('json', SupplierFiltersSchema),
    authMiddleware(),
    async (c) => {
        try {

            const filter = c.req.valid('json');

            const timeZone = c.req.header('x-client-timezone') || 'Asia/Kolkata';

            const filters = {
                workType: filter?.workType ?? undefined,
                productPattern: filter?.productPattern ?? undefined,
                supplierMachineType: filter?.supplierMachineType ?? undefined,
                mainCategory: filter?.mainCategory ?? undefined,
                jariBase: filter?.jariBase ?? undefined,
                cordingBase: filter?.cordingBase ?? undefined,
                type: filter?.type ?? undefined,
                stock: filter?.stock ?? undefined,
                productionCapacity: filter?.productionCapacity ?? undefined,
            };

            const suppliersQuery = await getAllSuppliersForReport(filters);

            if (!suppliersQuery.length) {
                return c.json({ message: 'No suppliers found' }, 404);
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Suppliers Report');

            // Define all columns with appropriate widths
            worksheet.columns = [
                { header: 'Company Name', key: 'companyName', width: 30 },
                { header: 'Supplier Name', key: 'supplierName', width: 30 },
                { header: 'Mobile No', key: 'mobileNo', width: 15 },
                { header: 'GST No', key: 'gstNo', width: 20 },
                { header: 'Work Type', key: 'workType', width: 20 },
                { header: 'Product Pattern', key: 'productPattern', width: 20 },
                { header: 'Machine Type', key: 'supplierMachineType', width: 30 },
                { header: 'Main Category', key: 'mainCategory', width: 20 },
                { header: 'Jari Base', key: 'jariBase', width: 15 },
                { header: 'Cording Base', key: 'cordingBase', width: 20 },
                { header: 'Type', key: 'type', width: 20 },
                { header: 'Stock', key: 'stock', width: 15 },
                { header: 'Production Capacity', key: 'productionCapacity', width: 20 },
                { header: 'Notes', key: 'notes', width: 30 },

                // Address fields
                { header: 'Address', key: 'address', width: 40 },
                { header: 'Area', key: 'area', width: 20 },
                { header: 'City', key: 'city', width: 20 },
                { header: 'State', key: 'state', width: 20 },
                { header: 'Pincode', key: 'pincode', width: 15 },
                { header: 'Lane', key: 'lane', width: 20 },
                { header: 'Society Name', key: 'societyName', width: 25 },
                { header: 'Plot No', key: 'plotNo', width: 15 },
                { header: 'Floor', key: 'floor', width: 15 },
                { header: 'Location Link', key: 'locationLink', width: 40 },

                { header: 'Created At', key: 'createdAt', width: 20 },
            ];

            // Add data rows with proper formatting
            worksheet.addRows(
                suppliersQuery.map((s) => ({
                    companyName: s.companyName || '',
                    supplierName: s.supplierName || '',
                    mobileNo: s.mobileNo || '',
                    gstNo: s.gstNo || '',
                    workType: formatArrayField(s.workType),
                    productPattern: formatArrayField(s.productPattern),
                    supplierMachineType: formatArrayField(s.supplierMachineType),
                    mainCategory: formatArrayField(s.mainCategory),
                    jariBase: formatArrayField(s.jariBase),
                    cordingBase: formatArrayField(s.cordingBase),
                    type: formatArrayField(s.type),
                    stock: formatArrayField(s.stock),
                    productionCapacity: formatArrayField(s.productionCapacity),
                    notes: s.notes || '',

                    // Address fields
                    address: s.address || '',
                    area: s.area || '',
                    city: s.city || '',
                    state: s.state || '',
                    pincode: s.pincode || '',
                    lane: s.lane || '',
                    societyName: s.societyName || '',
                    plotNo: s.plotNo || '',
                    floor: s.floor || '',
                    locationLink: s.locationLink || '',

                    // Format date with timezone
                    createdAt: formatInTimeZone(s.createdAt, timeZone, 'dd-MM-yyyy HH:mm:ss')
                }))
            );

            // Style the header row
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true
            };

            // Auto-size columns based on content
            worksheet.columns.forEach(column => {
                if (column.key) {
                    const headerLength = column.header ? column.header.length : 0;
                    const maxContentLength = Math.max(
                        ...suppliersQuery.map(row =>
                            String(row[column.key as keyof typeof suppliersQuery[0]] || '').length
                        )
                    );
                    column.width = Math.min(Math.max(headerLength, maxContentLength) + 2, 50); // Cap at 50 width
                }
            });



            // Generate and stream the Excel file
            return streamText(c, async (stream) => {
                c.header(
                    'Content-Type',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                );
                c.header('Content-Disposition', 'attachment; filename=suppliers-report.xlsx');

                stream.onAbort(() => {
                    console.log('Suppliers report stream aborted!');
                });

                const buffer = await workbook.xlsx.writeBuffer();
                await stream.write(new Uint8Array(buffer));
            });
        } catch (error) {
            console.error('Error in generate suppliers report', error);
            return c.json({ message: 'Error in generate suppliers report', cause: error }, 500);
        }
    }
);

// Order Report by Customer
reportRoute.post(
    '/generate-order-report/customer/:customerId',
    zValidator('json', OrderIdListRequest),
    authMiddleware(),
    async (c) => {
        try {
            const { customerId } = c.req.param();
            const { orderIds } = c.req.valid('json');

            const timeZone = c.req.header('x-client-timezone') || 'Asia/Kolkata';


            const ordersQuery = await getAllOrdersByOrderIdsForReport(orderIds || []);

            if (!ordersQuery.length) {
                return c.json({ message: 'No orders found for this customer' }, 404);
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(`Orders - Customer ${ordersQuery[0].customerName || customerId}`);

            worksheet.columns = [
                { header: 'Customer Name', key: 'customerName', width: 30 },
                { header: 'Supplier Name', key: 'productName', width: 30 },
                { header: 'Product Name', key: 'productName', width: 20 },
                { header: 'Type', key: 'type', width: 15 },
                { header: 'Sample', key: 'sample', width: 15 },
                { header: 'Stage', key: 'stage', width: 15 },
                { header: 'description', key: 'description', width: 40 },
                { header: 'Target Date', key: 'targetDate', width: 20 },
                { header: 'Created At', key: 'createdAt', width: 20 },
            ];

            worksheet.addRows(
                ordersQuery.map((o) => ({
                    customerName: o.customerName,
                    supplierName: o.supplierName,
                    productName: o.productName,
                    type: o.type,
                    sample: o.sample,
                    stage: o.stage,
                    description: o.description,
                    targetDate: o.targetDate ? formatInTimeZone(o.targetDate, timeZone, 'dd-MM-yyyy HH:mm:ss') : '',
                    createdAt: formatInTimeZone(o.createdAt, timeZone, 'dd-MM-yyyy HH:mm:ss'),
                }))
            );


            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.alignment = { horizontal: 'center' };

            return streamText(c, async (stream) => {
                c.header(
                    'Content-Type',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                );
                c.header(`Content-Disposition`, `attachment; filename=orders-customer-${customerId}.xlsx`);

                stream.onAbort(() => {
                    console.log('Customer order report stream aborted!');
                });

                const buffer = await workbook.xlsx.writeBuffer();
                await stream.write(new Uint8Array(buffer));
            });
        } catch (error) {
            console.error('Error in generate customer order report', error);
            return c.json({ message: 'Error in generate customer order report', cause: error }, 500);
        }
    }
);

// Order Report by Supplier
reportRoute.post(
    '/generate-order-report/supplier/:supplierId',
    zValidator('json', OrderIdListRequest),
    authMiddleware(),
    async (c) => {
        try {
            const { supplierId } = c.req.param();
            const { orderIds } = c.req.valid('json');
            const timeZone = c.req.header('x-client-timezone') || 'Asia/Kolkata';

            const ordersQuery = await getAllOrdersByOrderIdsForReport(orderIds || []);
            if (!ordersQuery.length) {
                return c.json({ message: 'No orders found for this supplier' }, 404);
            }


            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(`Orders - Supplier ${ordersQuery[0].supplierName || supplierId}`);

            worksheet.columns = [
                { header: 'Customer Name', key: 'customerName', width: 30 },
                { header: 'Supplier Name', key: 'productName', width: 30 },
                { header: 'Product Name', key: 'productName', width: 30 },
                { header: 'Type', key: 'type', width: 15 },
                { header: 'Sample', key: 'sample', width: 15 },
                { header: 'Stage', key: 'stage', width: 15 },
                { header: 'description', key: 'description', width: 40 },
                { header: 'Target Date', key: 'targetDate', width: 20 },
                { header: 'Created At', key: 'createdAt', width: 20 },
            ];

            worksheet.addRows(
                ordersQuery.map((o) => ({
                    customerName: o.customerName,
                    supplierName: o.supplierName,
                    productName: o.productName,
                    type: o.type,
                    sample: o.sample,
                    stage: o.stage,
                    description: o.description,
                    targetDate: o.targetDate ? formatInTimeZone(o.targetDate, timeZone, 'dd-MM-yyyy HH:mm:ss') : '',
                    createdAt: formatInTimeZone(o.createdAt, timeZone, 'dd-MM-yyyy HH:mm:ss'),
                }))
            );


            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.alignment = { horizontal: 'center' };

            return streamText(c, async (stream) => {
                c.header(
                    'Content-Type',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                );
                c.header(`Content-Disposition`, `attachment; filename=orders-supplier-${supplierId}.xlsx`);

                stream.onAbort(() => {
                    console.log('Supplier order report stream aborted!');
                });

                const buffer = await workbook.xlsx.writeBuffer();
                await stream.write(new Uint8Array(buffer));
            });
        } catch (error) {
            console.error('Error in generate supplier order report', error);
            return c.json({ message: 'Error in generate supplier order report', cause: error }, 500);
        }
    }
);

// slaes  pagination and filter
reportRoute.post(
    '/sale/get-all',
    zValidator('json', salesPaginationSchame),
    authMiddleware(),
    async (c) => {
        try {
            const { page, limit, filter, search } = c.req.valid('json');

            const sales = await getSalesByPagination({
                page: page?.valueOf() ?? 1,
                limit: limit?.valueOf() ?? 15,
                filter: filter,
                search: search,
            });

            return c.json(sales, 200);
        } catch (error) {
            console.error('Error in get sales by pagination', error);
            return c.json({ message: 'Error in get sales by pagination', cause: error }, 500);
        }
    }
);

function formatAddress(address: Address | null | undefined): string {
    if (!address) return '';

    const parts = [
        address.floor,
        address.plotNo,
        address.societyName,
        address.lane,
        address.address,
        address.area,
        address.city,
        address.state,
        address.pincode,
    ];

    // Join only non-null and non-empty parts with comma
    return parts.filter(Boolean).join(', ');
}

// report for sales
reportRoute.post(
    '/sale/generate-report',
    zValidator('json', salesFilterSchema),
    authMiddleware(),
    async (c) => {
        try {
            const filter = c.req.valid('json');
            const timeZone = c.req.header('x-client-timezone') || 'Asia/Kolkata';

            const sales = await getSalesReportwithFilter(filter);

            if (sales.length === 0) {
                return c.json({ message: 'No sales found for this filter' }, 404);
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sales Report');

            worksheet.columns = [
                { header: 'Customer Name', key: 'customerName', width: 30 },
                { header: 'Customer Company Name', key: 'customerCompanyName', width: 35 },
                { header: 'Customer Mobile Number', key: 'customerMobileNumber', width: 20 },
                { header: 'Customer Address ', key: 'customerAddress', width: 55 },
                { header: 'Supplier Name', key: 'productName', width: 30 },
                { header: 'Supplier Company Name', key: 'supplierCompanyName', width: 35 },
                { header: 'Supplier Mobile Number', key: 'supplierMobileNumber', width: 20 },
                { header: 'Supplier Address ', key: 'supplierAddress', width: 40 },
                { header: 'Type', key: 'type', width: 15 },
                { header: 'Stage', key: 'stage', width: 15 },
                { header: 'Product Name', key: 'productName', width: 20 },
                { header: 'Target Date', key: 'targetDate', width: 20 },
                { header: 'description', key: 'description', width: 40 },
            ];

            worksheet.addRows(
                sales.map((s) => ({
                    customerName: s.customerName,
                    customerCompanyName: s.customerCompany,
                    customerMobileNumber: s.customerMobile,
                    customerAddress: formatAddress(s.customerAddress),

                    supplierName: s.supplierName,
                    supplierCompanyName: s.supplierCompany,
                    supplierMobileNumber: s.supplierMobile,
                    supplierAddress: formatAddress(s.supplierAddress),

                    type: s.orderType,
                    stage: s.stage,
                    productName: s.productName,
                    targetDate: s.targetDate ? formatInTimeZone(s.targetDate, timeZone, 'dd-MM-yyyy HH:mm:ss') : '',
                    description: s.description,
                }))
            );

            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.alignment = { horizontal: 'center' };


              return streamText(c, async (stream) => {
                c.header(
                    'Content-Type',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                );
                c.header(`Content-Disposition`, `attachment; filename=sales-report.xlsx`);

                stream.onAbort(() => {
                    console.log('Supplier order report stream aborted!');
                });

                const buffer = await workbook.xlsx.writeBuffer();
                await stream.write(new Uint8Array(buffer));
            });


        } catch (error) {
            console.error('Error in get sales', error);
            return c.json({ message: 'Error in get sales', cause: error }, 500);
        }
    }
);