import express from "express";
import upload from "../../middleware/uploadMiddleware.js";
import {
  authenticateToken,
  adminAuth,
} from "../../middleware/authMiddleware.js";

import {
  getBanners,
  getBannersAdmin,
  getBannerDetailsById,
  createBannerController,
  updateBannerController,
  deleteBannerController,
} from "./homeBanner.controller.js";

const router = express.Router();

router.get("/admin", authenticateToken, adminAuth, getBannersAdmin);
router.get("/admin/:id", authenticateToken, adminAuth, getBannerDetailsById);

router.post(
  "/",
  authenticateToken,
  adminAuth,
  upload.fields([
    { name: "imageUrl", maxCount: 1 },
    { name: "mobileImageUrl", maxCount: 1 },
  ]),
  createBannerController,
);

router.put(
  "/:id",
  authenticateToken,
  adminAuth,
  upload.fields([
    { name: "imageUrl", maxCount: 1 },
    { name: "mobileImageUrl", maxCount: 1 },
  ]),
  updateBannerController,
);

router.delete("/:id", authenticateToken, adminAuth, deleteBannerController);

router.get("/", getBanners);

export default router;
