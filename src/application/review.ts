import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Review from "../infrastructure/schemas/Review";
import Product from "../infrastructure/schemas/Product";
import Order from "../infrastructure/schemas/Order";
import {
  CreateReviewDTO,
  UpdateReviewDTO,
  ReviewQueryDTO,
} from "../domain/dto/review";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";
import ForbiddenError from "../domain/errors/forbidden-error";

// Get reviews for a product or user
export const getReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const queryResult = ReviewQueryDTO.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(
        `Invalid query parameters: ${queryResult.error.issues.map((i) => i.message).join(", ")}`
      );
    }

    const { productId, userId, rating, page, limit, sortBy, sortOrder } =
      queryResult.data;

    // Build query
    const query: any = { isVisible: true };
    if (productId) query.productId = productId;
    if (userId) query.userId = userId;
    if (rating) query.rating = rating;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [reviews, totalCount] = await Promise.all([
      Review.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("productId", "name images")
        .lean(),
      Review.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit,
      },
    });
    return;
  } catch (error) {
    next(error);
  }
};

// Get review statistics for a product
export const getReviewStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;

    const stats = await Review.aggregate([
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId),
          isVisible: true,
        },
      },
      {
        $group: {
          _id: "$productId",
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          ratingDistribution: {
            $push: "$rating",
          },
        },
      },
      {
        $project: {
          totalReviews: 1,
          averageRating: { $round: ["$averageRating", 1] },
          ratingCounts: {
            5: {
              $size: {
                $filter: {
                  input: "$ratingDistribution",
                  cond: { $eq: ["$$this", 5] },
                },
              },
            },
            4: {
              $size: {
                $filter: {
                  input: "$ratingDistribution",
                  cond: { $eq: ["$$this", 4] },
                },
              },
            },
            3: {
              $size: {
                $filter: {
                  input: "$ratingDistribution",
                  cond: { $eq: ["$$this", 3] },
                },
              },
            },
            2: {
              $size: {
                $filter: {
                  input: "$ratingDistribution",
                  cond: { $eq: ["$$this", 2] },
                },
              },
            },
            1: {
              $size: {
                $filter: {
                  input: "$ratingDistribution",
                  cond: { $eq: ["$$this", 1] },
                },
              },
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    res.status(200).json(result);
    return;
  } catch (error) {
    next(error);
  }
};

// Create a new review
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = CreateReviewDTO.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(
        `Invalid review data: ${result.error.issues.map((i) => i.message).join(", ")}`
      );
    }

    const userId = req.auth?.userId;

    // Debug Clerk session data - removed for production

    // Extract user info from Clerk with multiple fallback options
    const userEmail =
      (req.auth?.sessionClaims?.email as string) ||
      (req.auth?.sessionClaims?.email_address as string) ||
      (req.auth?.sessionClaims?.primary_email_address as string) ||
      "unknown@example.com";

    const userName =
      (req.auth?.sessionClaims?.name as string) ||
      (req.auth?.sessionClaims?.full_name as string) ||
      (req.auth?.sessionClaims?.first_name as string) ||
      (req.auth?.sessionClaims?.username as string) ||
      userEmail.split("@")[0] ||
      "Anonymous User";

    if (!userId) {
      throw new ForbiddenError("User not authenticated");
    }

    // User info extracted successfully

    // Check if product exists
    const product = await Product.findById(result.data.productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productId: result.data.productId,
      userId: userId,
    });
    if (existingReview) {
      throw new ValidationError("You have already reviewed this product");
    }

    // Check if user has purchased this product (verified purchase)
    const hasOrdered = await Order.findOne({
      userId: userId,
      "items.product._id": new mongoose.Types.ObjectId(result.data.productId),
      orderStatus: { $in: ["DELIVERED"] },
    });

    // Create review
    const review = await Review.create({
      ...result.data,
      userId,
      userName,
      userEmail,
      isVerifiedPurchase: !!hasOrdered,
    });

    // Update product rating
    await updateProductRating(result.data.productId);

    const populatedReview = await Review.findById(review._id)
      .populate("productId", "name images")
      .lean();

    res.status(201).json(populatedReview);
    return;
  } catch (error) {
    next(error);
  }
};

// Update a review
export const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reviewId } = req.params;
    const result = UpdateReviewDTO.safeParse(req.body);

    if (!result.success) {
      throw new ValidationError(
        `Invalid review data: ${result.error.issues.map((i) => i.message).join(", ")}`
      );
    }

    const userId = req.auth?.userId;
    if (!userId) {
      throw new ForbiddenError("User not authenticated");
    }

    // Find review and check ownership
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found");
    }

    if (review.userId !== userId) {
      throw new ForbiddenError("You can only edit your own reviews");
    }

    // Update review
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      result.data,
      { new: true, runValidators: true }
    ).populate("productId", "name images");

    // Update product rating
    await updateProductRating(review.productId.toString());

    res.status(200).json(updatedReview);
    return;
  } catch (error) {
    next(error);
  }
};

// Delete a review
export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reviewId } = req.params;
    const userId = req.auth?.userId;

    if (!userId) {
      throw new ForbiddenError("User not authenticated");
    }

    // Find review and check ownership
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found");
    }

    if (review.userId !== userId) {
      throw new ForbiddenError("You can only delete your own reviews");
    }

    const productId = review.productId.toString();
    await Review.findByIdAndDelete(reviewId);

    // Update product rating
    await updateProductRating(productId);

    res.status(204).send();
    return;
  } catch (error) {
    next(error);
  }
};

// Mark review as helpful
export const markReviewHelpful = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found");
    }

    await review.markAsHelpful();
    res.status(200).json({ helpfulVotes: review.helpfulVotes });
    return;
  } catch (error) {
    next(error);
  }
};

// Report a review
export const reportReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found");
    }

    await review.report();
    res.status(200).json({
      message: "Review reported successfully",
      reportCount: review.reportCount,
      isVisible: review.isVisible,
    });
    return;
  } catch (error) {
    next(error);
  }
};

// Helper function to update product rating
async function updateProductRating(productId: string) {
  const stats = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        isVisible: true,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const rating = stats[0]
    ? {
        average: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
        count: stats[0].count,
      }
    : {
        average: 0,
        count: 0,
      };

  await Product.findByIdAndUpdate(productId, { rating });
}
