import mongoose from "mongoose";

// Define interfaces
interface IProduct {
  categoryId: mongoose.Types.ObjectId;
  images: string[]; // Multiple images array
  name: string;
  price: number;
  shortDescription: string; // Brief summary for cards
  detailedDescription: string; // Full description for product page
  specifications: {
    // Technical specifications
    brand?: string;
    model?: string;
    weight?: string;
    dimensions?: string;
    warranty?: string;
    connectivity?: string;
    batteryLife?: string;
    features?: string[];
    [key: string]: any; // Flexible for different product types
  };
  tags: string[]; // Search/filter tags
  rating: {
    average: number; // Average rating (0-5)
    count: number; // Number of reviews
  };
  stock: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Stripe integration fields
  stripeProductId?: string; // Stripe Product ID
  stripePriceId?: string; // Stripe Price ID

  // Legacy field for backward compatibility
  image?: string;
}

// Define methods interface
interface IProductMethods {
  hasStock(quantity: number): boolean;
  decreaseStock(quantity: number): Promise<any>;
}

// Combine both interfaces
type ProductModel = mongoose.Model<IProduct, {}, IProductMethods>;

const ProductSchema = new mongoose.Schema<
  IProduct,
  ProductModel,
  IProductMethods
>(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: "At least one image is required",
      },
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
      maxlength: 200,
    },
    detailedDescription: {
      type: String,
      required: true,
    },
    specifications: {
      brand: { type: String },
      model: { type: String },
      weight: { type: String },
      dimensions: { type: String },
      warranty: { type: String },
      connectivity: { type: String },
      batteryLife: { type: String },
      features: [{ type: String }],
    },
    tags: {
      type: [String],
      default: [],
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
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
    // Stripe integration fields
    stripeProductId: {
      type: String,
      required: false,
    },
    stripePriceId: {
      type: String,
      required: false,
    },
    // Legacy field for backward compatibility
    image: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

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

export default mongoose.model<IProduct, ProductModel>("Product", ProductSchema);
