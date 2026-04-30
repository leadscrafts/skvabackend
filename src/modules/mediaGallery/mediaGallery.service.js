import prisma from "../../config/prisma.js";
import { throwError } from "../../utils/throwError.js";

export const getAllMedia = async () => {
  try {
    return await prisma.mediaGallery.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    throwError("Failed to fetch media", 500);
  }
};

export const getAllMediaAdmin = async () => {
  try {
    return await prisma.mediaGallery.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    throwError("Failed to fetch media", 500);
  }
};

export const getMediaById = async (id) => {
  if (!id) throwError("Media ID is required", 400);

  try {
    const media = await prisma.mediaGallery.findFirst({
      where: {
        id: Number(id),
        isDeleted: false,
      },
    });

    if (!media) throwError("Media not found", 404);

    return media;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to fetch media", 500);
  }
};

export const createMedia = async (data) => {
  if (!data.url) throwError("URL is required", 400);
  if (!data.type) throwError("Type is required", 400);

  try {
    return await prisma.mediaGallery.create({ data });
  } catch (error) {
    throwError("Failed to create media", 500);
  }
};

export const updateMedia = async (id, data) => {
  if (!id) throwError("Media ID is required", 400);

  try {
    const existing = await prisma.mediaGallery.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Media not found", 404);
    }

    return await prisma.mediaGallery.update({
      where: { id: Number(id) },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to update media", 500);
  }
};

export const softDeleteMedia = async (id) => {
  if (!id) throwError("Media ID is required", 400);

  try {
    const existing = await prisma.mediaGallery.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Media not found", 404);
    }

    await prisma.mediaGallery.update({
      where: { id: Number(id) },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to delete media", 500);
  }
};

export const updateMediaStatus = async (id, isActive) => {
  if (!id) throwError("Media Id is required", 400);
  if (typeof isActive !== "boolean") {
    throwError("isActive must be boolean", 400);
  }

  try {
    const existing = await prisma.mediaGallery.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Media not found", 404);
    }

    return await prisma.mediaGallery.update({
      where: { id: Number(id) },
      data: {
        isActive,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to update media status", 500);
  }
};
