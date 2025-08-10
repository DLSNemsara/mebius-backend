import NotFoundError from "../domain/errors/not-found-error";
import Product from "../infrastructure/schemas/Product";
import { Request, Response, NextFunction } from "express";
import { CreateProductDTO, UpdateProductDTO } from "../domain/dto/product";
import ValidationError from "../domain/errors/validation-error";
import { getAuth } from "@clerk/express";
import { StripeService } from "../infrastructure/stripe";

const products = [
  {
    categoryId: "1",
    image: "/assets/products/airpods-max.png",
    id: "1",
    name: "AirPods Max",
    price: "549.00",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, sequi?",
  },
  {
    categoryId: "3",
    image: "/assets/products/echo-dot.png",
    id: "2",
    name: "Echo Dot",
    price: "99.00",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, sequi?",
  },
  {
    categoryId: "2",
    image: "/assets/products/pixel-buds.png",
    id: "3",
    name: "Galaxy Pixel Buds",
    price: "99.00",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, sequi?",
  },
  {
    categoryId: "1",
    image: "/assets/products/quietcomfort.png",
    id: "4",
    name: "Bose QuiteComfort",
    price: "249.00",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, sequi?",
  },
  {
    categoryId: "3",
    image: "/assets/products/soundlink.png",
    id: "5",
    name: "Bose SoundLink",
    price: "119.00",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, sequi?",
  },
  {
    categoryId: "5",
    image: "/assets/products/apple-watch.png",
    id: "6",
    name: "Apple Watch 9",
    price: "699.00",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, sequi?",
  },
  {
    categoryId: "4",
    image: "/assets/products/iphone-15.png",
    id: "7",
    name: "Apple Iphone 15",
    price: "1299.00",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, sequi?",
  },
  {
    categoryId: "4",
    image: "/assets/products/pixel-8.png",
    id: "8",
    name: "Galaxy Pixel 8",
    price: "549.00",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, sequi?",
  },
];

// Get all products
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { categoryId } = req.query;
    if (!categoryId) {
      const data = await Product.find();
      res.status(200).json(data);
      return;
    }

    const data = await Product.find({ categoryId });
    res.status(200).json(data);
    return;
  } catch (error) {
    next(error);
  }
};

// Create a product
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = CreateProductDTO.safeParse(req.body);
    if (!result.success) {
      console.error("Validation errors:", result.error.issues);
      throw new ValidationError(
        `Invalid product data: ${result.error.issues.map((i) => i.message).join(", ")}`
      );
    }

    // Handle legacy data conversion
    const productData = { ...result.data };

    // If legacy 'description' is provided but not shortDescription/detailedDescription
    if (result.data.description && !result.data.shortDescription) {
      productData.shortDescription = result.data.description.substring(0, 200);
      productData.detailedDescription = result.data.description;
    }

    // If legacy 'image' is provided but not images array
    if (
      result.data.image &&
      (!result.data.images || result.data.images.length === 0)
    ) {
      productData.images = [result.data.image];
    }

    // Create Stripe Product and Price
    try {
      const stripeData = await StripeService.createProductAndPrice(
        productData.name,
        productData.price,
        productData.shortDescription
      );

      // Add Stripe IDs to product data
      const productWithStripe = {
        ...productData,
        stripeProductId: stripeData.productId,
        stripePriceId: stripeData.priceId,
      };

      const product = await Product.create(productWithStripe);
      res.status(201).json(product);
      return;
    } catch (stripeError) {
      console.error("Failed to create Stripe product/price:", stripeError);
      // Continue with product creation even if Stripe fails
      // The product will be created without Stripe integration
      const product = await Product.create(productData);
      res.status(201).json(product);
      return;
    }
  } catch (error) {
    next(error);
  }
};

// Get products by category
export const getProductsByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const data = await Product.find({ categoryId }).populate("categoryId");
    res.status(200).json(data);
    return;
  } catch (error) {
    next(error);
  }
};

// Get a product by id
export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).populate("categoryId");
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    res.status(200).json(product);
    return;
  } catch (error) {
    next(error);
  }
};

// Delete a product
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      throw new NotFoundError("Product not found");
    }
    res.status(204).send();
    return;
  } catch (error) {
    next(error);
  }
};

// Update a product
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;
    const result = UpdateProductDTO.safeParse(req.body);

    if (!result.success) {
      console.error("Validation errors:", result.error.issues);
      throw new ValidationError(
        `Invalid product data: ${result.error.issues.map((i) => i.message).join(", ")}`
      );
    }

    const product = await Product.findByIdAndUpdate(id, result.data, {
      new: true,
      runValidators: true,
    }).populate("categoryId");

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    res.status(200).json(product);
    return;
  } catch (error) {
    next(error);
  }
};

// To fetch the stocks
export const checkStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, quantity } = req.query;
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    const isInStock = product.stock >= Number(quantity);
    res.status(200).json({
      isInStock,
      availableStock: product.stock,
      requestedQuantity: Number(quantity),
    });
    return;
  } catch (error) {
    next(error);
  }
};
