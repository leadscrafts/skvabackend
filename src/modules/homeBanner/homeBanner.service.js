import prisma from "../../config/prisma.js";
import { throwError } from "../../utils/throwError.js";

export const getAllBanners = async () => {
  try {
    return await prisma.homeBanner.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    throwError("Failed to fetch banners", 500);
  }
};

export const getAllBannersAdmin = async () => {
  try {
    return await prisma.homeBanner.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    throwError("Failed to fetch banners", 500);
  }
};

export const getBannerById = async (id) => {
  if (!id) throwError("Banner Id is required", 400);
  try {
    const banner = await prisma.homeBanner.findFirst({
      where: {
        id: Number(id),
        isDeleted: false,
      },
    });

    if (!banner) throwError("Banner not found", 404);

    return banner;
  } catch (error) {
    throwError("Failed to fetch banner", 500);
  }
};

export const createBanner = async (data) => {
  try {
    return await prisma.homeBanner.create({
      data,
    });
  } catch (error) {
    throwError("Failed to create banner", 500);
  }
};

export const updateBanner = async (id, data) => {
  if (!id) throwError("Banner ID is required", 400);

  try {
    const existing = await prisma.homeBanner.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Banner not found", 404);
    }

    return await prisma.homeBanner.update({
      where: { id: Number(id) },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to update banner", 500);
  }
};

export const softDeleteBanner = async (id) => {
  if (!id) throwError("Banner ID is required", 400);

  try {
    const existing = await prisma.homeBanner.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Banner not found", 404);
    }

    await prisma.homeBanner.update({
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
    throwError("Failed to delete banner", 500);
  }
};
