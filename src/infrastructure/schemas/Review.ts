import mongoose from "mongoose";

// Define interfaces
interface IReview {
  productId: mongoose.Types.ObjectId;
  userId: string; // Clerk user ID
  userName: string; // User's display name
  userEmail: string; // User's email for verification
  rating: number; // Rating from 1-5
  comment: string; // Review comment
  title?: string; // Optional review title
  isVerifiedPurchase: boolean; // Whether user actually bought the product
  helpfulVotes: number; // Number of users who found this review helpful
  reportCount: number; // Number of times this review was reported
  isVisible: boolean; // Admin can hide inappropriate reviews
  createdAt: Date;
  updatedAt: Date;
}

// Define methods interface
interface IReviewMethods {
  markAsHelpful(): Promise<any>;
  report(): Promise<any>;
  hide(): Promise<any>;
}

// Combine both interfaces
type ReviewModel = mongoose.Model<IReview, {}, IReviewMethods>;

const ReviewSchema = new mongoose.Schema<IReview, ReviewModel, IReviewMethods>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      default: "Anonymous User",
    },
    userEmail: {
      type: String,
      required: true,
      default: "unknown@example.com",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 2000,
    },
    title: {
      type: String,
      maxlength: 100,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to prevent duplicate reviews from same user for same product
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Index for efficient querying
ReviewSchema.index({ productId: 1, isVisible: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });

// Methods
ReviewSchema.methods.markAsHelpful = function () {
  this.helpfulVotes += 1;
  return this.save();
};

ReviewSchema.methods.report = function () {
  this.reportCount += 1;
  // Auto-hide if too many reports
  if (this.reportCount >= 5) {
    this.isVisible = false;
  }
  return this.save();
};

ReviewSchema.methods.hide = function () {
  this.isVisible = false;
  return this.save();
};

export default mongoose.model<IReview, ReviewModel>("Review", ReviewSchema);
