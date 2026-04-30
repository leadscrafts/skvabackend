import {
  getHomeVideo,
  upsertHomeVideo,
  updateHomeVideoStatus,
} from "./homeVideo.service.js";

export const getHomeVideoController = async (req, res) => {
  try {
    const data = await getHomeVideo();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch video",
    });
  }
};

export const saveHomeVideoController = async (req, res) => {
  try {
    const { videoUrl } = req.body;

    const data = await upsertHomeVideo(videoUrl);

    res.status(200).json({
      success: true,
      message: "Video saved successfully",
      data,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to save video",
    });
  }
};

export const updateHomeVideoStatusController = async (req, res) => {
  try {
    const isActive = req.body.isActive === true || req.body.isActive === "true";

    const data = await updateHomeVideoStatus(isActive);

    res.status(200).json({
      success: true,
      message: "Video status updated successfully",
      data,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update video status",
    });
  }
};
