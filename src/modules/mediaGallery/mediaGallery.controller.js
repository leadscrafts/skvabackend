import prisma from "../../config/prisma.js";
import {
  getAllMedia,
  getAllMediaAdmin,
  getMediaById,
  createMedia,
  updateMedia,
  softDeleteMedia,
} from "./mediaGallery.service.js";

import {
  uploadFileToSupabase,
  deleteFileFromSupabase,
} from "../../utils/supabaseStorage.js";

const parseBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
};

export const getMedia = async (req, res) => {
  try {
    const data = await getAllMedia();

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMediaAdmin = async (req, res) => {
  try {
    const data = await getAllMediaAdmin();

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMediaDetailsById = async (req, res) => {
  try {
    const data = await getMediaById(req.params.id);

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createMediaController = async (req, res) => {
  let uploadedUrl = null;

  try {
    const type = req.body.type;
    let url = null;

    if (req.files?.file?.[0]) {
      uploadedUrl = await uploadFileToSupabase(req.files.file[0], "media");
      url = uploadedUrl;
    }

    if (type === "video") {
      url = req.body.videoUrl;
    }

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    const payload = {
      type,
      url,
      title: req.body.title || null,
    };

    const created = await createMedia(payload);

    res.status(201).json({
      success: true,
      message: "Media created successfully",
      data: created,
    });
  } catch (error) {
    if (uploadedUrl) {
      await deleteFileFromSupabase(uploadedUrl);
    }

    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMediaController = async (req, res) => {
  const id = Number(req.params.id);
  let uploadedUrl = null;
  let oldUrl = null;

  try {
    const existing = await prisma.mediaGallery.findUnique({
      where: { id },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    oldUrl = existing.url;

    let url = null;

    // ✅ IMAGE upload
    if (req.files?.file?.[0]) {
      uploadedUrl = await uploadFileToSupabase(req.files.file[0], "media");
      url = uploadedUrl;
    }

    // ✅ VIDEO url
    if (req.body.videoUrl) {
      url = req.body.videoUrl;
    }

    const isActive = parseBoolean(req.body.isActive);

    const updateData = {
      ...(url && { url }),
      ...(req.body.title !== undefined && { title: req.body.title }),
      ...(req.body.type && { type: req.body.type }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    };

    const updated = await updateMedia(id, updateData);

    // ✅ delete old file only if new file uploaded
    if (uploadedUrl && oldUrl) {
      await deleteFileFromSupabase(oldUrl);
    }

    res.status(200).json({
      success: true,
      message: "Media updated successfully",
      data: updated,
    });
  } catch (error) {
    // rollback uploaded file if failure
    if (uploadedUrl) {
      await deleteFileFromSupabase(uploadedUrl);
    }

    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};
export const deleteMediaController = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const existing = await prisma.mediaGallery.findUnique({
      where: { id },
    });

    const url = existing?.url;

    await softDeleteMedia(id);

    if (url) {
      await deleteFileFromSupabase(url);
    }

    res.status(200).json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMediaStatusController = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const isActive = req.body.isActive === true || req.body.isActive === "true";

    const data = await updateMediaStatus(id, isActive);

    res.status(200).json({
      success: true,
      message: "Media status updated successfully",
      data,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update media status",
    });
  }
};
