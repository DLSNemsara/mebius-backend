import mongoose from "mongoose";

// Define interfaces
interface IWishlist {
  userId: string; // Clerk user ID
  productId: mongoose.Types.ObjectId;
  addedAt: Date;
}

interface IWishlistMethods {
  // Add instance methods here if needed
}

interface WishlistModel
  extends mongoose.Model<IWishlist, {}, IWishlistMethods> {
  // Add static methods here if needed
}

const WishlistSchema = new mongoose.Schema<
  IWishlist,
  WishlistModel,
  IWishlistMethods
>({
  userId: {
    type: String,
    required: true,
    index: true, // Index for faster queries by user
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index to prevent duplicate entries
WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Create the model
const Wishlist = mongoose.model<IWishlist, WishlistModel>(
  "Wishlist",
  WishlistSchema
);

export { Wishlist, IWishlist };
