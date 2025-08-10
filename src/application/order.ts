import { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import ValidationError from "../domain/errors/validation-error";
import Order from "../infrastructure/schemas/Order";
import NotFoundError from "../domain/errors/not-found-error";
import Address from "../infrastructure/schemas/Address";
import { CreateOrderDTO } from "../domain/dto/order";
import Product from "../infrastructure/schemas/Product";
import { StripeService } from "../infrastructure/stripe";
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

    // Calculate total amount
    const totalAmount = result.data.items.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );

    // Prepare order data
    const orderData: any = {
      userId,
      items: result.data.items,
      addressId: address[0]._id,
      paymentMethod: result.data.paymentMethod,
    };

    // Handle Stripe payment method
    if (result.data.paymentMethod === "CARD") {
      try {
        // Create Stripe PaymentIntent
        const paymentIntent = await StripeService.createPaymentIntent(
          totalAmount,
          "", // We'll update this after order creation
          {
            userId,
            itemsCount: result.data.items.length.toString(),
          }
        );

        // Add Stripe data to order
        orderData.stripePaymentIntentId = paymentIntent.id;
        orderData.stripePaymentIntentStatus = paymentIntent.status;
        orderData.paymentStatus = "PENDING"; // Will be updated via webhook

        // Store client secret for frontend
        orderData.stripePaymentIntentClientSecret = paymentIntent.client_secret;
      } catch (stripeError) {
        console.error("Failed to create Stripe PaymentIntent:", stripeError);
        throw new ValidationError(
          "Failed to process card payment. Please try again."
        );
      }
    } else {
      // COD payment method
      orderData.paymentStatus = "PENDING";
    }

    // Store the created order
    const order = await Order.create([orderData], { session });

    // Update Stripe PaymentIntent with order ID if it's a card payment
    if (
      result.data.paymentMethod === "CARD" &&
      orderData.stripePaymentIntentId
    ) {
      try {
        await StripeService.updatePaymentIntentMetadata(
          orderData.stripePaymentIntentId,
          { orderId: order[0]._id.toString() }
        );
      } catch (stripeError) {
        console.error("Failed to update PaymentIntent metadata:", stripeError);
        // Continue with order creation even if metadata update fails
      }
    }

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

    // Return the order ID and payment information
    const response: any = { _id: order[0]._id };

    if (result.data.paymentMethod === "CARD") {
      response.paymentIntent = {
        id: orderData.stripePaymentIntentId,
        client_secret: orderData.stripePaymentIntentClientSecret,
      };
    }

    res.status(201).json(response);
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

export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getAuth(req).userId;
    // For testing, use a dummy user ID
    // const userId = "test_user_id"; // Remove getAuth(req).userId temporarily

    if (!userId) {
      throw new ValidationError("User not authenticated");
    }

    const orders = await Order.find({ userId })
      .populate({
        path: "addressId",
        model: "Address",
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

// Admin order management functions
export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (status && status !== "all") {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate({
        path: "addressId",
        model: "Address",
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      orders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalOrders / Number(limit)),
        totalOrders,
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const updateData: any = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate({
      path: "addressId",
      model: "Address",
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({
      orderStatus: "PENDING",
    });
    const confirmedOrders = await Order.countDocuments({
      orderStatus: "CONFIRMED",
    });
    const shippedOrders = await Order.countDocuments({
      orderStatus: "SHIPPED",
    });
    const deliveredOrders = await Order.countDocuments({
      orderStatus: "DELIVERED",
    });
    const cancelledOrders = await Order.countDocuments({
      orderStatus: "CANCELLED",
    });

    // Calculate total revenue from delivered orders
    const deliveredOrdersWithItems = await Order.find({
      orderStatus: "DELIVERED",
    });
    const totalRevenue = deliveredOrdersWithItems.reduce((sum, order) => {
      const orderTotal = order.items.reduce((orderSum: number, item: any) => {
        return orderSum + item.product.price * item.quantity;
      }, 0);
      return sum + orderTotal;
    }, 0);

    res.status(200).json({
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    });
  } catch (error) {
    next(error);
  }
};
