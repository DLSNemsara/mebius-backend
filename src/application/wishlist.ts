import { Request, Response, NextFunction } from "express";
import { Wishlist } from "../infrastructure/schemas/Wishlist";
import Product from "../infrastructure/schemas/Product";
import {
  AddToWishlistDTO,
  RemoveFromWishlistDTO,
} from "../domain/dto/wishlist";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";

// Get user's wishlist
export const getWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const wishlistItems = await Wishlist.find({ userId })
      .populate({
        path: "productId",
        populate: {
          path: "categoryId",
          model: "Category",
        },
      })
      .sort({ addedAt: -1 }); // Most recently added first

    // Filter out any items where the product was deleted
    const validWishlistItems = wishlistItems.filter((item) => item.productId);

    res.status(200).json(validWishlistItems);
  } catch (error) {
    next(error);
  }
};

// Add item to wishlist
export const addToWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const result = AddToWishlistDTO.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError("Invalid product ID");
    }

    const { productId } = result.data;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Check if item already exists in wishlist
    const existingItem = await Wishlist.findOne({ userId, productId });
    if (existingItem) {
      return res.status(200).json({
        message: "Item already in wishlist",
        wishlistItem: existingItem,
      });
    }

    // Add to wishlist
    const wishlistItem = await Wishlist.create({
      userId,
      productId,
    });

    // Populate the product data for response
    const populatedItem = await Wishlist.findById(wishlistItem._id).populate({
      path: "productId",
      populate: {
        path: "categoryId",
        model: "Category",
      },
    });

    res.status(201).json({
      message: "Item added to wishlist",
      wishlistItem: populatedItem,
    });
  } catch (error) {
    next(error);
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const result = RemoveFromWishlistDTO.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError("Invalid product ID");
    }

    const { productId } = result.data;

    const deletedItem = await Wishlist.findOneAndDelete({ userId, productId });

    if (!deletedItem) {
      throw new NotFoundError("Item not found in wishlist");
    }

    res.status(200).json({
      message: "Item removed from wishlist",
    });
  } catch (error) {
    next(error);
  }
};

// Check if item is in wishlist
export const checkWishlistStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { productId } = req.params;

    const wishlistItem = await Wishlist.findOne({ userId, productId });

    res.status(200).json({
      isInWishlist: !!wishlistItem,
      wishlistItem: wishlistItem || null,
    });
  } catch (error) {
    next(error);
  }
};

// Get wishlist count for a user
export const getWishlistCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const count = await Wishlist.countDocuments({ userId });

    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};
