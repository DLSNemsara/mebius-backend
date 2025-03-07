import NotFoundError from "../domain/errors/not-found-error";
import Category from "../infrastructure/schemas/Category";
import { Request, Response, NextFunction } from "express";
import { CategoryDTO } from "../domain/dto/category";
import ValidationError from "../domain/errors/validation-error";
import { z } from "zod";

// Get all categories
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await Category.find();
    res.status(200).json(data);
    return;
  } catch (error) {
    next(error);
  }
};

// Create a category
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // const result:CategoryDTO = (req.body); //Only compile time even if its wrong type in req.body
    const result = CategoryDTO.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError("Invalid category data");
    }

    await Category.create(result.data);
    res.status(201).send();
    return;
  } catch (error) {
    next(error);
  }
};

// Get a category by id
export const getCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const category = await Category.findById(id);
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    res.status(200).json(category);
    return;
  } catch (error) {
    next(error);
  }
};
// Delete a category
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    res.status(204).send();
    return;
  } catch (error) {
    next(error);
  }
};
// Update a category
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const category = await Category.findByIdAndUpdate(id, req.body);

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    res.status(200).send(category);
    return;
  } catch (error) {
    next(error);
  }
};
