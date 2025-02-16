import express from "express";
import { productRouter } from "./api/product.js";
import globalErrorHandlingMiddleware from "./api/middleware/global-error-handling-middleware.js";
import { connectDB } from "./infrastructure/db.js";
import { categoryRouter } from "./api/category.js";
import "dotenv/config";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

app.use((req, res, next) => {
  console.log("Request received");
  console.log(req.method, req.url);
  next();
});

app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use(globalErrorHandlingMiddleware);

connectDB();
app.listen(8000, () => console.log(`Server running on port ${8000}`));
