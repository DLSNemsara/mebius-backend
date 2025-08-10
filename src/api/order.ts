import express from "express";
import {
  createOrder,
  getOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
} from "../application/order";
import { isAuthenticated } from "./middleware/authentication-middleware";
import { isAdmin } from "./middleware/authorization-middleware";

export const orderRouter = express.Router();

orderRouter.route("/").post(isAuthenticated, createOrder);
// orderRouter.route("/").post(createOrder); //For local testing

orderRouter.route("/").get(isAuthenticated, getUserOrders);
// orderRouter.route("/").get(getUserOrders); //For local testing

orderRouter.route("/:id").get(isAuthenticated, getOrder);
// orderRouter.route("/:id").get(getOrder); //For local testing

// Admin routes
orderRouter.route("/admin/all").get(isAuthenticated, isAdmin, getAllOrders);
orderRouter.route("/admin/stats").get(isAuthenticated, isAdmin, getOrderStats);
orderRouter
  .route("/admin/:id/status")
  .patch(isAuthenticated, isAdmin, updateOrderStatus);
