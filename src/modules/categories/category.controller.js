import {
  getAllCategories,
  getAllCategoriesAdmin,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  softDeleteCategory,
} from "./category.service.js";
import prisma from "../../config/prisma.js";
import {
  uploadImageToSupabase,
  deleteImageFromSupabase,
} from "../../utils/supabaseStorage.js";

const parseBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
};

export const getCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch categories",
    });
  }
};

export const getCategoriesAdmin = async (req, res) => {
  try {
    const categories = await getAllCategoriesAdmin();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch categories",
    });
  }
};

export const getCategoryDetailsById = async (req, res) => {
  try {
    const category = await getCategoryById(req.params.id);

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch category",
    });
  }
};

export const getCategoryDetailsBySlug = async (req, res) => {
  try {
    const category = await getCategoryBySlug(req.params.slug);

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch category",
    });
  }
};

export const createCategoryController = async (req, res) => {
  let uploadedImageUrl = null;
  let uploadedBannerUrl = null;

  try {
    if (req.files?.imageUrl?.[0]) {
      uploadedImageUrl = await uploadImageToSupabase(
        req.files.imageUrl[0],
        "categories",
      );
    }

    if (req.files?.bannerUrl?.[0]) {
      uploadedBannerUrl = await uploadImageToSupabase(
        req.files.bannerUrl[0],
        "categories",
      );
    }

    const isActive = parseBoolean(req.body.isActive);

    const payload = {
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description || null,
      imageUrl: uploadedImageUrl,
      bannerUrl: uploadedBannerUrl,
      ...(isActive !== undefined && { isActive }),
    };

    const created = await createCategory(payload);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: created,
    });
  } catch (error) {
    if (uploadedImageUrl) {
      await deleteImageFromSupabase(uploadedImageUrl);
    }

    if (uploadedBannerUrl) {
      await deleteImageFromSupabase(uploadedBannerUrl);
    }

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create category",
    });
  }
};

export const updateCategoryController = async (req, res) => {
  const id = Number(req.params.id);
  let uploadedImageUrl = null;
  let uploadedBannerUrl = null;
  let oldImageUrl = null;
  let oldBannerUrl = null;

  try {
    const existing = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    oldImageUrl = existing.imageUrl;
    oldBannerUrl = existing.bannerUrl;

    if (req.files?.imageUrl?.[0]) {
      uploadedImageUrl = await uploadImageToSupabase(
        req.files.imageUrl[0],
        "categories",
      );
    }

    if (req.files?.bannerUrl?.[0]) {
      uploadedBannerUrl = await uploadImageToSupabase(
        req.files.bannerUrl[0],
        "categories",
      );
    }

    const isActive = parseBoolean(req.body.isActive);

    const updateData = {
      ...(req.body.name !== undefined && { name: req.body.name }),
      ...(req.body.slug !== undefined && { slug: req.body.slug }),
      ...(req.body.description !== undefined && {
        description: req.body.description || null,
      }),
      ...(isActive !== undefined && { isActive }),
      ...(uploadedImageUrl && { imageUrl: uploadedImageUrl }),
      ...(uploadedBannerUrl && { bannerUrl: uploadedBannerUrl }),
    };

    const updated = await updateCategory(id, updateData);

    if (uploadedImageUrl && oldImageUrl) {
      await deleteImageFromSupabase(oldImageUrl);
    }

    if (uploadedBannerUrl && oldBannerUrl) {
      await deleteImageFromSupabase(oldBannerUrl);
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updated,
    });
  } catch (error) {
    if (uploadedImageUrl) {
      await deleteImageFromSupabase(uploadedImageUrl);
    }

    if (uploadedBannerUrl) {
      await deleteImageFromSupabase(uploadedBannerUrl);
    }

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update category",
    });
  }
};

export const deleteCategoryController = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const existing = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await softDeleteCategory(id);

    if (existing.imageUrl) {
      await deleteImageFromSupabase(existing.imageUrl);
    }

    if (existing.bannerUrl) {
      await deleteImageFromSupabase(existing.bannerUrl);
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to delete category",
    });
  }
};
