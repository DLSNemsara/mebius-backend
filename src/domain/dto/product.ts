import { z } from "zod";

// Helper function to validate URL or relative path
const imageUrlSchema = z.string().refine((val) => {
  // Allow empty strings to be filtered out later
  if (!val || val.trim() === "") return false;

  // Check if it's a valid URL
  try {
    new URL(val);
    return true;
  } catch {
    // If not a valid URL, check if it's a relative path starting with /
    return val.startsWith("/") || val.startsWith("./") || val.startsWith("../");
  }
}, "Invalid image URL or path");

export const CreateProductDTO = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().positive("Price must be positive"),
  shortDescription: z
    .string()
    .min(1, "Short description is required")
    .max(200, "Short description must be under 200 characters"),
  detailedDescription: z.string().min(1, "Detailed description is required"),
  categoryId: z.string().min(1, "Category is required"),
  images: z
    .array(imageUrlSchema)
    .min(1, "At least one image is required")
    .transform((images) => images.filter((img) => img && img.trim())), // Filter out empty strings
  specifications: z
    .object({
      brand: z.string().optional(),
      model: z.string().optional(),
      weight: z.string().optional(),
      dimensions: z.string().optional(),
      warranty: z.string().optional(),
      connectivity: z.string().optional(),
      batteryLife: z.string().optional(),
      features: z.array(z.string()).optional(),
    })
    .optional(),
  tags: z.array(z.string()).default([]),
  stock: z.number().min(0, "Stock cannot be negative").default(0),

  // Legacy support
  image: z.string().optional(), // For backward compatibility
  description: z.string().optional(), // For backward compatibility
});

// Update DTO for partial updates with more flexible image validation
export const UpdateProductDTO = CreateProductDTO.partial().extend({
  images: z
    .array(imageUrlSchema)
    .optional()
    .transform((images) =>
      images ? images.filter((img) => img && img.trim()) : undefined
    ), // Filter out empty strings for updates
});
