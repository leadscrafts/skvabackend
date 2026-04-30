import express from "express";
import upload from "../../middleware/uploadMiddleware.js";
import {
  authenticateToken,
  adminAuth,
} from "../../middleware/authMiddleware.js";

import {
  getMedia,
  getMediaAdmin,
  getMediaDetailsById,
  createMediaController,
  updateMediaController,
  deleteMediaController,
  updateMediaStatusController,
} from "./mediaGallery.controller.js";

const router = express.Router();

router.get("/", getMedia);

router.get("/admin", authenticateToken, adminAuth, getMediaAdmin);
router.get("/admin/:id", authenticateToken, adminAuth, getMediaDetailsById);

router.post(
  "/",
  authenticateToken,
  adminAuth,
  upload.fields([{ name: "file", maxCount: 1 }]),
  createMediaController,
);

router.put(
  "/:id",
  authenticateToken,
  adminAuth,
  upload.fields([{ name: "file", maxCount: 1 }]),
  updateMediaController,
);

router.delete("/:id", authenticateToken, adminAuth, deleteMediaController);

router.patch(
  "/:id/status",
  authenticateToken,
  adminAuth,
  updateMediaStatusController,
);

export default router;
