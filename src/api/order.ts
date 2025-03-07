import express from "express";
import { createOrder, getOrder } from "../application/order";
import { isAuthenticated } from "./middleware/authentication-middleware";

export const orderRouter = express.Router();

orderRouter.route("/").post(isAuthenticated, createOrder);
// orderRouter.route("/").post(createOrder); //For local testing

orderRouter.route("/:id").get(isAuthenticated, getOrder);
// orderRouter.route("/:id").get(getOrder); //For local testing
