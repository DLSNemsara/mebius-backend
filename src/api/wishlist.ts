import { Router } from "express";
import { isAuthenticated } from "./middleware/authentication-middleware";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  getWishlistCount,
} from "../application/wishlist";

const router = Router();

// All wishlist routes require authentication
router.use(isAuthenticated);

// GET /api/wishlist - Get user's wishlist
router.get("/", getWishlist);

// GET /api/wishlist/count - Get wishlist item count
router.get("/count", getWishlistCount);

// GET /api/wishlist/check/:productId - Check if product is in wishlist
router.get("/check/:productId", checkWishlistStatus);

// POST /api/wishlist - Add item to wishlist
router.post("/", addToWishlist);

// DELETE /api/wishlist - Remove item from wishlist
router.delete("/", removeFromWishlist);

export default router;
