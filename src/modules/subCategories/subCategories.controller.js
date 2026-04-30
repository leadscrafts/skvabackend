import prisma from "../../config/prisma.js";
import {
  createSubCategory,
  getAllSubCategories,
  getAllSubCategoriesAdmin,
  getSubCategoryById,
  getSubCategoryBySlug,
  softDeleteSubCategory,
  updateSubCategory,
  updateSubCategoryActive,
} from "./subCategories.service.js";
import {
  deleteFileFromSupabase,
  uploadFileToSupabase,
} from "../../utils/supabaseStorage.js";

const parseBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
};

export const getSubCategoriesController = async (req, res) => {
  try {
    const subCategories = await getAllSubCategories();

    res.status(200).json({
      success: true,
      data: subCategories,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch subCategories",
    });
  }
};

export const getSubCategoriesAdminController = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const results = await getAllSubCategoriesAdmin({
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      ...results,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch subCategories",
    });
  }
};

export const getSubCategoryByIdController = async (req, res) => {
  try {
    const subCategory = await getSubCategoryById(req.params.id);

    res.status(200).json({
      success: true,
      data: subCategory,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch subCategory",
    });
  }
};

export const getSubCategoryBySlugController = async (req, res) => {
  try {
    const subCategory = await getSubCategoryBySlug(req.params.slug);

    res.status(200).json({
      success: true,
      data: subCategory,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch subCategory",
    });
  }
};

export const createSubCategoryController = async (req, res) => {
  let uploadedImageUrl = null;
  let uploadedBannerUrl = null;

  try {
    if (req.files?.imageUrl?.[0]) {
      uploadedImageUrl = await uploadFileToSupabase(
        req.files.imageUrl[0],
        "subcategories",
      );
    }

    if (req.files?.bannerUrl?.[0]) {
      uploadedBannerUrl = await uploadFileToSupabase(
        req.files.bannerUrl[0],
        "subcategories",
      );
    }

    const isActive = parseBoolean(req.body.isActive);

    const payload = {
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description || null,
      imageUrl: uploadedImageUrl,
      bannerUrl: uploadedBannerUrl,
      displayOrder:
        req.body.displayOrder !== undefined
          ? Number(req.body.displayOrder)
          : undefined,
      categoryId: req.body.categoryId,
      ...(isActive !== undefined && { isActive }),
    };

    const created = await createSubCategory(payload);

    res.status(201).json({
      success: true,
      message: "SubCategory created successfully",
      data: created,
    });
  } catch (error) {
    if (uploadedImageUrl) {
      await deleteFileFromSupabase(uploadedImageUrl);
    }

    if (uploadedBannerUrl) {
      await deleteFileFromSupabase(uploadedBannerUrl);
    }

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create subCategory",
    });
  }
};

export const updateSubCategoryController = async (req, res) => {
  const id = Number(req.params.id);
  let uploadedImageUrl = null;
  let uploadedBannerUrl = null;
  let oldImageUrl = null;
  let oldBannerUrl = null;

  try {
    const existing = await prisma.subCategory.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "SubCategory not found",
      });
    }

    oldImageUrl = existing.imageUrl;
    oldBannerUrl = existing.bannerUrl;

    if (req.files?.imageUrl?.[0]) {
      uploadedImageUrl = await uploadFileToSupabase(
        req.files.imageUrl[0],
        "subcategories",
      );
    }

    if (req.files?.bannerUrl?.[0]) {
      uploadedBannerUrl = await uploadFileToSupabase(
        req.files.bannerUrl[0],
        "subcategories",
      );
    }

    const isActive = parseBoolean(req.body.isActive);

    const updateData = {
      ...(req.body.name !== undefined && { name: req.body.name }),
      ...(req.body.slug !== undefined && { slug: req.body.slug }),
      ...(req.body.description !== undefined && {
        description: req.body.description || null,
      }),
      ...(req.body.categoryId !== undefined && {
        categoryId: req.body.categoryId,
      }),
      ...(req.body.displayOrder !== undefined && {
        displayOrder: Number(req.body.displayOrder),
      }),
      ...(isActive !== undefined && { isActive }),
      ...(uploadedImageUrl && { imageUrl: uploadedImageUrl }),
      ...(uploadedBannerUrl && { bannerUrl: uploadedBannerUrl }),
    };

    const updated = await updateSubCategory(id, updateData);

    if (uploadedImageUrl && oldImageUrl) {
      await deleteFileFromSupabase(oldImageUrl);
    }

    if (uploadedBannerUrl && oldBannerUrl) {
      await deleteFileFromSupabase(oldBannerUrl);
    }

    res.status(200).json({
      success: true,
      message: "SubCategory updated successfully",
      data: updated,
    });
  } catch (error) {
    if (uploadedImageUrl) {
      await deleteFileFromSupabase(uploadedImageUrl);
    }

    if (uploadedBannerUrl) {
      await deleteFileFromSupabase(uploadedBannerUrl);
    }

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update subCategory",
    });
  }
};

export const deleteSubCategoryController = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const existing = await prisma.subCategory.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "SubCategory not found",
      });
    }

    await softDeleteSubCategory(id);

    if (existing.imageUrl) {
      await deleteFileFromSupabase(existing.imageUrl);
    }

    if (existing.bannerUrl) {
      await deleteFileFromSupabase(existing.bannerUrl);
    }

    res.status(200).json({
      success: true,
      message: "SubCategory deleted successfully",
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to delete subCategory",
    });
  }
};

export const updateSubCategoryActiveController = async (req, res) => {
  try {
    const isActive = parseBoolean(req.body.isActive);

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: "isActive must be provided as true or false",
      });
    }

    const updated = await updateSubCategoryActive(req.params.id, isActive);

    res.status(200).json({
      success: true,
      message: "SubCategory active status updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update subCategory active status",
    });
  }
};
