import express from "express";
import { createOrder, getOrder } from "../application/order";

export const orderRouter = express.Router();

orderRouter.route("/").post(createOrder);
orderRouter.route("/:id").get(getOrder);
