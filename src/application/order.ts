import { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import ValidationError from "../domain/errors/validation-error";
import Order from "../infrastructure/schemas/Order";
import NotFoundError from "../domain/errors/not-found-error";
import Address from "../infrastructure/schemas/Address";
import { CreateOrderDTO } from "../domain/dto/order";

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = CreateOrderDTO.safeParse(req.body);
    if (!result.success) {
      console.error("Validation error:", result.error);
      throw new ValidationError("Invalid order data");
    }

    const userId = getAuth(req).userId;

    if (!userId) {
      throw new ValidationError("User not authenticated");
    }

    const address = await Address.create({
      ...result.data.shippingAddress,
    });

    // Store the created order
    const order = await Order.create({
      userId,
      items: result.data.items,
      addressId: address._id,
    });

    // Return the order ID in the response
    res.status(201).json({ _id: order._id });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const order = await Order.findById(id)
      .populate({
        path: "addressId",
        model: "Address",
      })
      .populate({
        path: "items",
      });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};
