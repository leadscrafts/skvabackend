import prisma from "../../config/prisma.js";
import {
  createProduct,
  getAllProducts,
  getAllProductsAdmin,
  getFilteredProducts,
  getProductById,
  getProductBySlug,
  softDeleteProduct,
  updateProduct,
  updateProductActive,
  updateProductFeatured,
} from "./products.service.js";
import {
  deleteImageFromSupabase,
  uploadImageToSupabase,
} from "../../utils/supabaseStorage.js";

const parseBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
};

const parseJson = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      const err = new Error(`Invalid JSON format for ${fieldName}`);
      err.status = 400;
      throw err;
    }
  }

  return value;
};

const getGalleryUrls = (galleryImages) => {
  if (!galleryImages) return [];
  if (Array.isArray(galleryImages)) {
    return galleryImages.filter((item) => typeof item === "string");
  }
  return [];
};

const getUploadedGalleryUrls = async (files = []) => {
  const urls = [];
  for (const file of files) {
    const url = await uploadImageToSupabase(file, "products");
    urls.push(url);
  }
  return urls;
};

export const getProductsController = async (req, res) => {
  try {
    const { page, limit, search, category, subcategory } = req.query;

    const result = await getFilteredProducts({
      page,
      limit,
      search,
      category,
      subcategory,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch products",
    });
  }
};

export const getProductsAdminController = async (req, res) => {
  try {
    const products = await getAllProductsAdmin();

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch products",
    });
  }
};

export const getProductByIdController = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch product",
    });
  }
};

export const getProductBySlugController = async (req, res) => {
  try {
    const product = await getProductBySlug(req.params.slug);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch product",
    });
  }
};

export const createProductController = async (req, res) => {
  let uploadedGalleryUrls = [];

  try {
    uploadedGalleryUrls = await getUploadedGalleryUrls(req.files || []);

    const bodyGallery = parseJson(req.body.galleryImages, "galleryImages");
    const bodyGalleryUrls = getGalleryUrls(bodyGallery);
    const mergedGalleryImages = [...bodyGalleryUrls, ...uploadedGalleryUrls];

    const payload = {
      name: req.body.name,
      slug: req.body.slug,
      shortDescription: req.body.shortDescription || null,
      fullDescription: req.body.fullDescription || null,
      specifications: parseJson(req.body.specifications, "specifications"),
      galleryImages:
        mergedGalleryImages.length > 0 ? mergedGalleryImages : null,
      categoryId: req.body.categoryId,
      subcategoryId:
        req.body.subcategoryId !== undefined ? req.body.subcategoryId : null,
      ...(parseBoolean(req.body.isActive) !== undefined && {
        isActive: parseBoolean(req.body.isActive),
      }),
      ...(parseBoolean(req.body.isFeatured) !== undefined && {
        isFeatured: parseBoolean(req.body.isFeatured),
      }),
    };

    const created = await createProduct(payload);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: created,
    });
  } catch (error) {
    for (const url of uploadedGalleryUrls) {
      await deleteImageFromSupabase(url);
    }

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
};

export const updateProductController = async (req, res) => {
  const id = Number(req.params.id);
  let oldGalleryUrls = [];
  let uploadedGalleryUrls = [];

  try {
    const existing = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    oldGalleryUrls = getGalleryUrls(existing.galleryImages);
    uploadedGalleryUrls = await getUploadedGalleryUrls(req.files || []);

    const updateData = {
      ...(req.body.name !== undefined && { name: req.body.name }),
      ...(req.body.slug !== undefined && { slug: req.body.slug }),
      ...(req.body.shortDescription !== undefined && {
        shortDescription: req.body.shortDescription || null,
      }),
      ...(req.body.fullDescription !== undefined && {
        fullDescription: req.body.fullDescription || null,
      }),
      ...(req.body.specifications !== undefined && {
        specifications: parseJson(req.body.specifications, "specifications"),
      }),
      ...(req.body.categoryId !== undefined && {
        categoryId: req.body.categoryId,
      }),
      ...(req.body.subcategoryId !== undefined && {
        subcategoryId: req.body.subcategoryId || null,
      }),
      ...(parseBoolean(req.body.isActive) !== undefined && {
        isActive: parseBoolean(req.body.isActive),
      }),
      ...(parseBoolean(req.body.isFeatured) !== undefined && {
        isFeatured: parseBoolean(req.body.isFeatured),
      }),
    };

    if (
      req.body.galleryImages !== undefined ||
      uploadedGalleryUrls.length > 0
    ) {
      const bodyGallery = parseJson(req.body.galleryImages, "galleryImages");
      const bodyGalleryUrls = getGalleryUrls(bodyGallery);
      const mergedGalleryImages = [...bodyGalleryUrls, ...uploadedGalleryUrls];
      updateData.galleryImages =
        mergedGalleryImages.length > 0 ? mergedGalleryImages : null;
    }

    const updated = await updateProduct(id, updateData);

    const updatedGalleryUrls = getGalleryUrls(updated.galleryImages);
    const removedUrls = oldGalleryUrls.filter(
      (url) => !updatedGalleryUrls.includes(url),
    );

    for (const url of removedUrls) {
      await deleteImageFromSupabase(url);
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updated,
    });
  } catch (error) {
    for (const url of uploadedGalleryUrls) {
      await deleteImageFromSupabase(url);
    }

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update product",
    });
  }
};

export const deleteProductController = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const existing = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await softDeleteProduct(id);

    const galleryUrls = getGalleryUrls(existing.galleryImages);
    for (const url of galleryUrls) {
      await deleteImageFromSupabase(url);
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to delete product",
    });
  }
};

export const updateProductActiveController = async (req, res) => {
  try {
    const isActive = parseBoolean(req.body.isActive);
    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: "isActive must be provided as true or false",
      });
    }

    const updated = await updateProductActive(req.params.id, isActive);

    res.status(200).json({
      success: true,
      message: "Product active status updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update product active status",
    });
  }
};

export const updateProductFeaturedController = async (req, res) => {
  try {
    const isFeatured = parseBoolean(req.body.isFeatured);
    if (isFeatured === undefined) {
      return res.status(400).json({
        success: false,
        message: "isFeatured must be provided as true or false",
      });
    }

    const updated = await updateProductFeatured(req.params.id, isFeatured);

    res.status(200).json({
      success: true,
      message: "Product featured status updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update product featured status",
    });
  }
};
