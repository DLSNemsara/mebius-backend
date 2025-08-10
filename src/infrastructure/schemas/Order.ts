import mongoose from "mongoose";

const OrderProductSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
});

const ItemSchema = new mongoose.Schema({
  product: { type: OrderProductSchema, required: true },
  quantity: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    items: {
      type: [ItemSchema],
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PENDING",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "CARD"],
      default: "COD",
      required: true,
    },
    // Stripe integration fields
    stripePaymentIntentId: {
      type: String,
      required: false,
    },
    stripePaymentIntentStatus: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const Order = mongoose.model("Order", OrderSchema);

export default Order;
