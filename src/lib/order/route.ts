import { getAllCustomersIdAndName } from "@/db/queries/customer";
import { createOrder, deleteOrder, getAllOrders, getAllOrdersByCustomerId, getAllOrdersBySupplierId, getOrderById, updateOrder } from "@/db/queries/order";
import { getSupplierIdAndName } from "@/db/queries/supplier";
import { OrderInsert } from "@/db/type";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "../middleware";
import { deleteImageFromCloudinary, getSignedImageUrl, uploadImageToCloudinary } from "../upload/image";
import { CreateOrderRequest, DeleteOrderRequest, GetOrderRequest, UpdateOrderRequest } from "./type";


export const orderRoute = new Hono();

export type OrderFilter = {
  customerId?: string;
  supplierId?: string;
  stage?: string[];
  type?: string[];
  productName?: string;
  fromDate?: Date;
  toDate?: Date;
};

// Create an order
orderRoute.post("/create", zValidator('form', CreateOrderRequest), authMiddleware(), async (c) => {
  const body = await c.req.parseBody();

  const data = c.req.valid("form");


  // Validate required fields
  const customerId = data.customerId;
  const supplierId = data.supplierId;


  // Handle image uploads
  const imageFiles = Array.isArray(body["images[]"])
    ? body["images[]"]
    : body["images[]"]
      ? [body["images[]"]]
      : [];

  const uploadedImages = await Promise.all(
    imageFiles
      .filter((f): f is File => f instanceof File)
      .map((file) =>
        uploadImageToCloudinary(file, file.name, "orders").then((img) => ({
          public_id: img.public_id,
          name: img.name,
          note: ''
        }))
      )
  );


  // Order fields
  const orderData: OrderInsert = {
    orderId: uuidv4(),
    customerId,
    supplierId,
    images: uploadedImages,
    productName: data.productName ?? null,
    type: data.type ?? null,
    sample: data.sample ?? null,
    stage: data.stage ?? null,
    description: data.description ?? null,
    targetDate: data.targetDate ? new Date(data.targetDate) : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const savedOrder = await createOrder(orderData);
    return c.json({
      message: "Order created successfully",
      orderId: savedOrder.orderId,
      savedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return c.json({ error: "Failed to create order", details: error }, 500);
  }
});

// Update an order
orderRoute.put("/update", zValidator("form", UpdateOrderRequest), authMiddleware(), async (c) => {
  const data = c.req.valid("form");
  const orderId = data.orderId;

  if (!orderId) return c.json({ error: "Missing order ID" }, 400);

  const body = await c.req.parseBody();

  const existingOrder = await getOrderById(orderId);
  if (!existingOrder) return c.json({ error: "Order not found" }, 404);

  // Handle images
  const existingImageIds = data.existingImages ?? [];

  const imagesToDelete = (existingOrder.images ?? []).filter(
    (img) => !existingImageIds.includes(img.public_id)
  );
  await Promise.all(
    imagesToDelete.map((img) => deleteImageFromCloudinary(img.public_id))
  );

  const keptImages = (existingOrder.images ?? []).filter((img) =>
    existingImageIds.includes(img.public_id)
  );

  const newImageFiles = Array.isArray(body["images[]"])
    ? body["images[]"]
    : body["images[]"]
      ? [body["images[]"]]
      : [];

  const uploadedNewImages = await Promise.all(
    newImageFiles
      .filter((f): f is File => f instanceof File)
      .map((file) =>
        uploadImageToCloudinary(file, file.name, "orders").then((img) => ({
          public_id: img.public_id,
          name: img.name,
          note: ''
        }))
      )
  );

  const finalImages = [...keptImages, ...uploadedNewImages];

  // Prepare updated order
  const updatedOrderData: Partial<OrderInsert> = {
    customerId: data.customerId,
    supplierId: data.supplierId,
    images: finalImages,
    productName: data.productName ?? null,
    type: data.type ?? null,
    sample: data.sample ?? null,
    stage: data.stage ?? null,
    description: data.description ?? null,
    targetDate: data.targetDate ? new Date(data.targetDate) : null,
    updatedAt: new Date(),
  };

  try {
    const updatedOrder = await updateOrder(orderId, updatedOrderData);
    return c.json({
      message: "Order updated successfully",
      orderId,
      updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return c.json(
      { error: "Failed to update order", details: error },
      500
    );
  }
}
);


// Delete an order
orderRoute.delete("/delete/:id", zValidator("param", DeleteOrderRequest), authMiddleware(), async (c) => {

  const data = c.req.valid("param");

  const orderId = data.id;

  if (!orderId) return c.json({ error: "Missing order ID" }, 400);

  const existingOrder = await getOrderById(orderId);
  if (!existingOrder) return c.json({ error: "Order not found" }, 404);

  try {
    // Delete images from Cloudinary
    const images = existingOrder.images ?? [];
    await Promise.all(images.map((img) => deleteImageFromCloudinary(img.public_id)));

    // Delete order record
    await deleteOrder(orderId);

    return c.json({ message: `Order with ID ${orderId} deleted successfully` });
  } catch (error) {
    console.error("Error deleting order:", error);
    return c.json({ error: "Failed to delete order", details: error }, 500);
  }
});

// Get an order by ID
orderRoute.get("/get-one/:id", zValidator("param", GetOrderRequest), authMiddleware(), async (c) => {

  const data = c.req.valid("param");

  const orderId = data.id;

  const order = await getOrderById(orderId);
  if (!order) return c.json({ error: "Order not found" }, 404);

  // Generate signed URLs for images
  const imagesWithSignedUrls = (order.images ?? []).map((img) => ({
    ...img,
    signedUrl: getSignedImageUrl(img.public_id),
  }));

  return c.json({
    ...order,
    images: imagesWithSignedUrls,
  });
});

// Get all orders with pagination and filtering
orderRoute.post("/get-all", async (c) => {
  const body = await c.req.json();

  const limit = Number(body.limit) || 10;
  const offset = Number(body.offset) || 0;

  const filters: OrderFilter = {
    customerId: body.filters?.customerId ?? undefined,
    supplierId: body.filters?.supplierId ?? undefined,
    stage: body.filters?.stage ?? undefined,
    type: body.filters?.type ?? undefined,
    productName: body.filters?.productName ?? undefined,
    fromDate: body.filters?.fromDate ? new Date(body.filters.fromDate) : undefined,
    toDate: body.filters?.toDate ? new Date(body.filters.toDate) : undefined,
  };

  try {
    const { data: orders, total } = await getAllOrders({ limit, offset, filters, search: body.search });

    const enrichedOrders = orders.map((order) => {
      const imagesWithSignedUrls = (order.images ?? []).map((img) => ({
        ...img,
        signedUrl: getSignedImageUrl(img.public_id),
      }));

      return {
        ...order,
        images: imagesWithSignedUrls,
      };
    });

    return c.json({
      data: enrichedOrders,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return c.json({ error: "Failed to fetch orders", details: error }, 500);
  }
});

//  get all suppliers -> id and name
orderRoute.get("/get-suppliers", authMiddleware(), async (c) => {
  try {
    const suppliers = await getSupplierIdAndName();
    return c.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return c.json({ error: "Failed to fetch suppliers", details: error }, 500);
  }
});

// get all customers -> id and name
orderRoute.get("/get-customers", authMiddleware(), async (c) => {
  try {
    const customers = await getAllCustomersIdAndName(); 

    return c.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return c.json({ error: "Failed to fetch customers", details: error }, 500);
  }
});

// get all orders by customer ID
orderRoute.get("/get-by-customer/:id", zValidator("param", GetOrderRequest), authMiddleware(), async (c) => {

  const data = c.req.valid("param");

  const customerId = data.id;
  if (!customerId) return c.json({ error: "Missing customer ID" }, 400);
  try {

    const orders = await getAllOrdersByCustomerId(customerId);

    if (!orders || orders.length === 0) return c.json([]);
    const enrichedOrders = orders.map((order) => {
      const imagesWithSignedUrls = (order.images ?? []).map((img) => ({
        ...img,
        signedUrl: getSignedImageUrl(img.public_id),
      }));

      return {
        ...order,
        images: imagesWithSignedUrls,
      };
    });

    return c.json(enrichedOrders);
  } catch (error) {
    console.error("Error fetching orders by customer:", error);
    return c.json({ error: "Failed to fetch orders by customer", details: error }, 500);
  }

});


// get all orders by supplier ID
orderRoute.get("/get-by-supplier/:id", zValidator("param", GetOrderRequest), authMiddleware(), async (c) => {

  const data = c.req.valid("param");

  const supplierId = data.id;
  if (!supplierId) return c.json({ error: "Missing supplier ID" }, 400);

  try {
    const orders = await getAllOrdersBySupplierId(supplierId);
    if (!orders || orders.length === 0) {
      return c.json([]);
    }

    const enrichedOrders = orders.map((order) => {
      const imagesWithSignedUrls = (order.images ?? []).map((img) => ({
        ...img,
        signedUrl: getSignedImageUrl(img.public_id),
      }));

      return {
        ...order,
        images: imagesWithSignedUrls,
      };
    });
    return c.json(enrichedOrders);
  } catch (error) {
    console.error("Error fetching orders by supplier:", error);
    return c.json({ error: "Failed to fetch orders by supplier", details: error }, 500);

  }
});