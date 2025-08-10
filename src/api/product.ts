import express from "express";
import {
  getProducts,
  createProduct,
  getProduct,
  deleteProduct,
  updateProduct,
  checkStock,
} from "../application/product";
import { isAuthenticated } from "./middleware/authentication-middleware";
import { isAdmin } from "./middleware/authorization-middleware";

export const productRouter = express.Router();

productRouter
  .route("/")
  .get(getProducts)
  .post(isAuthenticated, isAdmin, createProduct);
// .post(createProduct); //For local testing

productRouter.route("/check-stock").get(checkStock);

productRouter
  .route("/:id")
  .get(getProduct)
  .delete(isAuthenticated, isAdmin, deleteProduct)
  .patch(isAuthenticated, isAdmin, updateProduct);

//For production environment
// .delete(deleteProduct)
// .patch(updateProduct);
