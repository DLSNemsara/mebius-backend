import express, { ErrorRequestHandler } from "express";
import { productRouter } from "./api/product";
import globalErrorHandlingMiddleware from "./api/middleware/global-error-handling-middleware";
import { connectDB } from "./infrastructure/db";
import { categoryRouter } from "./api/category";
import "dotenv/config";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use(globalErrorHandlingMiddleware);

connectDB();
app.listen(8000, () => console.log(`Server running on port ${8000}`));
