import prisma from "../../config/prisma.js";
import {
  getAllBanners,
  getAllBannersAdmin,
  getBannerById,
  createBanner,
  updateBanner,
  softDeleteBanner,
} from "./homeBanner.service.js";

import {
  uploadFileToSupabase,
  deleteFileFromSupabase,
} from "../../utils/supabaseStorage.js";

const parseBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
};

export const getBanners = async (req, res) => {
  try {
    const data = await getAllBanners();

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch banners",
    });
  }
};

export const getBannersAdmin = async (req, res) => {
  try {
    const data = await getAllBannersAdmin();

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch banners",
    });
  }
};

export const getBannerDetailsById = async (req, res) => {
  try {
    const data = await getBannerById(req.params.id);

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch banner",
    });
  }
};

export const createBannerController = async (req, res) => {
  let uploadedImageUrl = null;

  try {
    if (req.files?.imageUrl?.[0]) {
      uploadedImageUrl = await uploadFileToSupabase(
        req.files.imageUrl[0],
        "banners",
      );
    }

    const isActive = parseBoolean(req.body.isActive);

    const payload = {
      imageUrl: uploadedImageUrl,
      title: req.body.title || null,
      highlight: req.body.highlight || null,
      description: req.body.description || null,

      ...(isActive !== undefined && { isActive }),
    };

    const created = await createBanner(payload);

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: created,
    });
  } catch (error) {
    if (uploadedImageUrl) {
      await deleteFileFromSupabase(uploadedImageUrl);
    }

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create banner",
    });
  }
};

export const updateBannerController = async (req, res) => {
  const id = Number(req.params.id);
  let uploadedImageUrl = null;
  let oldImageUrl = null;

  try {
    const existing = await prisma.homeBanner.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    oldImageUrl = existing.imageUrl;

    if (req.files?.imageUrl?.[0]) {
      uploadedImageUrl = await uploadFileToSupabase(
        req.files.imageUrl[0],
        "banners",
      );
    }

    const isActive = parseBoolean(req.body.isActive);

    const updateData = {
      ...(isActive !== undefined && { isActive }),
      ...(uploadedImageUrl && { imageUrl: uploadedImageUrl }),

      ...(req.body.title !== undefined && { title: req.body.title }),
      ...(req.body.highlight !== undefined && {
        highlight: req.body.highlight,
      }),
      ...(req.body.description !== undefined && {
        description: req.body.description,
      }),
    };

    const updated = await updateBanner(id, updateData);

    if (uploadedImageUrl && oldImageUrl) {
      await deleteFileFromSupabase(oldImageUrl);
    }

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: updated,
    });
  } catch (error) {
    if (uploadedImageUrl) {
      await deleteFileFromSupabase(uploadedImageUrl);
    }

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update banner",
    });
  }
};

export const deleteBannerController = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const existing = await prisma.homeBanner.findUnique({
      where: { id },
    });

    const imageUrl = existing?.imageUrl;

    await softDeleteBanner(id);

    if (imageUrl) {
      await deleteFileFromSupabase(imageUrl);
    }

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to delete banner",
    });
  }
};
