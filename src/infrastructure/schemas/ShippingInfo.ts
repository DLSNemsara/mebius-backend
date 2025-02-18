import mongoose from "mongoose";

const ShippingInfoSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  shippingAddress: {
    type: String,
    required: true,
  },
  shippingCity: {
    type: String,
    required: true,
  },
  shippingPostalCode: {
    type: String,
    required: true,
  },
  shippingCountry: {
    type: String,
    required: true,
  },
  shippingStatus: {
    type: String,
    enum: ["pending", "shipped", "delivered", "returned"],
    default: "pending",
  },
});

export default mongoose.model("ShippingInfo", ShippingInfoSchema);
