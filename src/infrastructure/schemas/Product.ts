import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  isAvailable: {
    type: Boolean,
    default: function () {
      return this.stock > 0;
    },
  },
});

// These methods should stay in the schema
ProductSchema.methods.hasStock = function (quantity: number) {
  return this.stock >= quantity;
};

ProductSchema.methods.decreaseStock = function (quantity: number) {
  if (this.stock < quantity) {
    throw new Error("Insufficient stock");
  }
  this.stock -= quantity;
  this.isAvailable = this.stock > 0;
  return this.save();
};

export default mongoose.model("Product", ProductSchema);
