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
app.use(clerkMiddleware());
app.use(
  cors({
    origin: [
      "https://mebius-frontend-sinel.netlify.app", //For production environment
      "http://localhost:5173", // For local testing
    ],
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors()); // Enable CORS for preflight requests
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentsRouter);

app.use(globalErrorHandlingMiddleware);

connectDB();
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
