import { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import ValidationError from "../domain/errors/validation-error";
import Order from "../infrastructure/schemas/Order";
import NotFoundError from "../domain/errors/not-found-error";
import Address from "../infrastructure/schemas/Address";
import { CreateOrderDTO } from "../domain/dto/order";
import Product from "../infrastructure/schemas/Product";
import mongoose from "mongoose";

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = CreateOrderDTO.safeParse(req.body);
    if (!result.success) {
      console.error("Validation error:", result.error);
      throw new ValidationError("Invalid order data");
    }

    const userId = getAuth(req).userId;
    // For testing, use a dummy user ID
    // const userId = "test_user_id"; // Remove getAuth(req).userId temporarily

    if (!userId) {
      throw new ValidationError("User not authenticated");
    }

    // Verify stock availability for all items
    for (const item of result.data.items) {
      const product = await Product.findById(item.product._id).session(session);
      if (!product) {
        throw new NotFoundError(`Product ${item.product._id} not found`);
      }
      if (!product.hasStock(item.quantity)) {
        throw new ValidationError(
          `Insufficient stock for product ${product.name}. Available: ${product.stock}`
        );
      }
    }

    // Create address
    const address = await Address.create(
      [
        {
          ...result.data.shippingAddress,
        },
      ],
      { session }
    );

    // Store the created order
    const order = await Order.create(
      [
        {
          userId,
          items: result.data.items,
          addressId: address[0]._id,
        },
      ],
      { session }
    );

    // Update stock for each product
    for (const item of result.data.items) {
      const product = await Product.findById(item.product._id).session(session);
      if (!product) {
        throw new NotFoundError(`Product ${item.product._id} not found`);
      }
      await product.decreaseStock(item.quantity);
    }

    // Commit the transaction
    await session.commitTransaction();

    // Return the order ID in the response
    res.status(201).json({ _id: order[0]._id });
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    next(error);
  } finally {
    // End the session
    session.endSession();
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
