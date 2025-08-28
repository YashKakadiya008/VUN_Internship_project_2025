import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";
import userRouter from "@/lib/user/route";
import { productRoute } from "@/lib/product/route";
import { orderRoute } from "@/lib/order/route";
import { supplierRoute } from "@/lib/supplier/route";
import { customerRoute } from "@/lib/customer/route";
import { reportRoute } from "./report/route";

export const runtime = 'nodejs'

const app = new Hono().basePath('/api');

// Middleware for CORS
app.use('*', cors());

app.get('/health', (c) => {
  return c.json({
    status: "ok",
    message: "Welcome to the Hono API!",
    timestamp: new Date().toISOString()
  });
});



// routes
app.route("/user", userRouter)

app.route("/product", productRoute);

app.route("/order", orderRoute);

app.route("/supplier", supplierRoute);

//customer routes
app.route("/customer", customerRoute);

app.route("/report", reportRoute);

app.notFound((c) => {
  return c.json({
    status: 'error',
    message: 'Not Found',
  }, 404);
});



export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
