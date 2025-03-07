import NotFoundError from "../domain/errors/not-found-error";
import Product from "../infrastructure/schemas/Product";
import { Request, Response, NextFunction } from "express";
import { CreateProductDTO } from "../domain/dto/product";
import ValidationError from "../domain/errors/validation-error";

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
) => {
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

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = CreateProductDTO.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError("Invalid product data");
    }
    await Product.create(result.data);
    res.status(201).send();
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
) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).populate("categoryId");
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    res.status(200).json(product).send();
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
) => {
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
) => {
  try {
    const id = req.params.id;
    const product = await Product.findByIdAndUpdate(id, req.body);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    res.status(200).send(product);
    return;
  } catch (error) {
    next(error);
  }
};

// Add this to your existing product.ts file
export const checkStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, quantity } = req.query;

    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const hasStock = product.hasStock(Number(quantity));
    res.status(200).json({
      hasStock,
      availableStock: product.stock,
    });
  } catch (error) {
    next(error);
  }
};
