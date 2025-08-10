import express from "express";
import {
  getReviews,
  getReviewStats,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview,
} from "../application/review";
import { isAuthenticated } from "./middleware/authentication-middleware";

export const reviewRouter = express.Router();

// Public routes
reviewRouter.get("/", getReviews); // Get reviews with query params
reviewRouter.get("/stats/:productId", getReviewStats); // Get review statistics for a product

// Protected routes
reviewRouter.post("/", isAuthenticated, createReview); // Create a review
reviewRouter.patch("/:reviewId", isAuthenticated, updateReview); // Update a review
reviewRouter.delete("/:reviewId", isAuthenticated, deleteReview); // Delete a review

// Public interaction routes
reviewRouter.post("/:reviewId/helpful", markReviewHelpful); // Mark review as helpful
reviewRouter.post("/:reviewId/report", reportReview); // Report a review
