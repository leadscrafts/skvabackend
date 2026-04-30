import prisma from "../../config/prisma.js";
import {
  createProduct,
  getAllProducts,
  getAllProductsAdmin,
  getFilteredProducts,
  getProductById,
  getProductBySlug,
  getBrochureService,
  removeBrochureService,
  softDeleteProduct,
  updateProduct,
  updateProductActive,
  updateProductFeatured,
  uploadBrochureService,
} from "./products.service.js";
import {
  deleteFileFromSupabase,
  uploadFileToSupabase,
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

export const getGalleryUrls = (gallery) => {
  if (!gallery) return [];

  let parsed = gallery;

  if (typeof gallery === "string") {
    try {
      parsed = JSON.parse(gallery);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.filter((url) => typeof url === "string" && url.trim() !== "");
};

const getUploadedGalleryUrls = async (files = []) => {
  const urls = [];
  for (const file of files) {
    const url = await uploadFileToSupabase(file, "products");
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
    const { page = 1, limit = 10, categoryId } = req.query;

    const result = await getAllProductsAdmin({
      page: parseInt(page),
      limit: parseInt(limit),
      categoryId: parseInt(categoryId),
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

    uploadedGalleryUrls = uploadedGalleryUrls.filter(
      (url) => typeof url === "string" && url.trim() !== "",
    );

    const bodyGallery = parseJson(req.body.galleryImages, "galleryImages");

    let bodyGalleryUrls = getGalleryUrls(bodyGallery);

    bodyGalleryUrls = bodyGalleryUrls.filter(
      (url) => typeof url === "string" && url.trim() !== "",
    );

    const mergedGalleryImages = [
      ...bodyGalleryUrls,
      ...uploadedGalleryUrls,
    ].filter((url) => typeof url === "string" && url.trim() !== "");

    const payload = {
      name: req.body.name,
      slug: req.body.slug,
      shortDescription: req.body.shortDescription || null,
      fullDescription: req.body.fullDescription || null,
      specifications: parseJson(req.body.specifications, "specifications"),
      videoUrl: req.body.videoUrl || null,
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
      try {
        await deleteFileFromSupabase(url);
      } catch (err) {
        console.error("Rollback delete failed:", url);
      }
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
      where: { id },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    oldGalleryUrls = getGalleryUrls(existing.galleryImages);
    uploadedGalleryUrls = await getUploadedGalleryUrls(req.files || []);

    uploadedGalleryUrls = uploadedGalleryUrls.filter(
      (url) => typeof url === "string" && url.trim() !== "",
    );

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
      ...(req.body.videoUrl !== undefined && {
        videoUrl: req.body.videoUrl || null,
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
      let bodyGallery = parseJson(req.body.galleryImages, "galleryImages");

      let bodyGalleryUrls = getGalleryUrls(bodyGallery);

      bodyGalleryUrls = bodyGalleryUrls.filter(
        (url) => typeof url === "string" && url.trim() !== "",
      );

      const mergedGalleryImages = [
        ...bodyGalleryUrls,
        ...uploadedGalleryUrls,
      ].filter((url) => typeof url === "string" && url.trim() !== "");

      updateData.galleryImages =
        mergedGalleryImages.length > 0 ? mergedGalleryImages : null;
    }

    const updated = await updateProduct(id, updateData);

    const updatedGalleryUrls = getGalleryUrls(updated.galleryImages);

    const removedUrls = oldGalleryUrls.filter(
      (url) =>
        typeof url === "string" &&
        url.trim() !== "" &&
        !updatedGalleryUrls.includes(url),
    );

    for (const url of removedUrls) {
      try {
        await deleteImageFromSupabase(url);
      } catch (err) {
        console.error("Failed to delete image:", url, err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updated,
    });
  } catch (error) {
    for (const url of uploadedGalleryUrls) {
      try {
        await deleteImageFromSupabase(url);
      } catch (err) {
        console.error("Rollback delete failed:", url);
      }
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
      await deleteFileFromSupabase(url);
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

export const uploadBrochureController = async (req, res) => {
  let uploadedUrl = null;

  try {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { brochureUrl: true, isDeleted: true },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let brochureUrl = req.body.brochureUrl || null;

    if (req.file) {
      uploadedUrl = await uploadFileToSupabase(req.file, "products/brochures");
      brochureUrl = uploadedUrl;
    }

    if (!brochureUrl) {
      return res.status(400).json({
        success: false,
        message: "Brochure file or brochureUrl is required",
      });
    }

    const updated = await uploadBrochureService(id, brochureUrl);

    if (uploadedUrl && existing.brochureUrl) {
      await deleteFileFromSupabase(existing.brochureUrl);
    }

    res.status(200).json({
      success: true,
      message: "Brochure uploaded successfully",
      data: updated,
    });
  } catch (error) {
    if (uploadedUrl) {
      await deleteFileFromSupabase(uploadedUrl);
    }

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to upload brochure",
    });
  }
};

export const removeBrochureController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { brochureUrl: true, isDeleted: true },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const updated = await removeBrochureService(id);

    if (existing.brochureUrl) {
      await deleteFileFromSupabase(existing.brochureUrl);
    }

    res.status(200).json({
      success: true,
      message: "Brochure removed successfully",
      data: updated,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to remove brochure",
    });
  }
};

export const getBrochureController = async (req, res) => {
  try {
    const brochure = await getBrochureService(req.params.id);

    res.status(200).json({
      success: true,
      data: brochure,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch brochure",
    });
  }
};
