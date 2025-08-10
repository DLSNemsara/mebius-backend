import { z } from "zod";

export const AddToWishlistDTO = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export const RemoveFromWishlistDTO = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export type AddToWishlistType = z.infer<typeof AddToWishlistDTO>;
export type RemoveFromWishlistType = z.infer<typeof RemoveFromWishlistDTO>;
