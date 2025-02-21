import express, { ErrorRequestHandler } from "express";
import { connectDB } from "./infrastructure/db";
import { productRouter } from "./api/product";
import { categoryRouter } from "./api/category";
import { orderRouter } from "./api/order";
import { paymentsRouter } from "./api/payment";
import globalErrorHandlingMiddleware from "./api/middleware/global-error-handling-middleware";
import { clerkMiddleware } from "@clerk/express";
import "dotenv/config";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));
app.use(clerkMiddleware());

app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentsRouter);
app.use(globalErrorHandlingMiddleware);

connectDB();
app.listen(8000, () => console.log(`Server running on port ${8000}`));
