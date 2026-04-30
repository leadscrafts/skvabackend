import prisma from "../../config/prisma.js";
import { throwError } from "../../utils/throwError.js";

const convertToEmbed = (url) => {
  if (!url) return url;

  // supports both watch?v= and youtu.be
  const match = url.match(/v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);

  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }

  return url;
};

export const getHomeVideo = async () => {
  try {
    return await prisma.homeVideo.findFirst({
      where: {
        isActive: true,
      },
    });
  } catch (error) {
    throwError("Failed to fetch video", 500);
  }
};

export const upsertHomeVideo = async (videoUrl) => {
  if (!videoUrl) throwError("Video URL is required", 400);

  try {
    const embedUrl = convertToEmbed(videoUrl);

    return await prisma.homeVideo.upsert({
      where: { id: 1 },
      update: {
        videoUrl: embedUrl,
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        videoUrl: embedUrl,
      },
    });
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to save video", 500);
  }
};

export const updateHomeVideoStatus = async (isActive) => {
  if (typeof isActive !== "boolean") {
    throwError("isActive must be boolean", 400);
  }

  try {
    const existing = await prisma.homeVideo.findUnique({
      where: { id: 1 },
    });

    if (!existing) {
      throwError("Home video not found. Add video first.", 404);
    }

    return await prisma.homeVideo.update({
      where: { id: 1 },
      data: {
        isActive,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to update video status", 500);
  }
};
