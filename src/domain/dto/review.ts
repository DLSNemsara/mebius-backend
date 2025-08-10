import { z } from "zod";

export const CreateReviewDTO = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z
    .string()
    .min(10, "Review comment must be at least 10 characters")
    .max(2000, "Review comment cannot exceed 2000 characters"),
  title: z
    .string()
    .max(100, "Review title cannot exceed 100 characters")
    .optional(),
});

export const UpdateReviewDTO = z.object({
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5")
    .optional(),
  comment: z
    .string()
    .min(10, "Review comment must be at least 10 characters")
    .max(2000, "Review comment cannot exceed 2000 characters")
    .optional(),
  title: z
    .string()
    .max(100, "Review title cannot exceed 100 characters")
    .optional(),
});

export const ReviewQueryDTO = z.object({
  productId: z.string().optional(),
  userId: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  sortBy: z.enum(["createdAt", "rating", "helpfulVotes"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateReviewData = z.infer<typeof CreateReviewDTO>;
export type UpdateReviewData = z.infer<typeof UpdateReviewDTO>;
export type ReviewQueryData = z.infer<typeof ReviewQueryDTO>;
