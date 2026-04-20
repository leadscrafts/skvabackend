import express from "express";
import upload from "../../middleware/uploadMiddleware.js";
import {
  adminAuth,
  authenticateToken,
} from "../../middleware/authMiddleware.js";
import {
  createSubCategoryController,
  deleteSubCategoryController,
  getSubCategoriesAdminController,
  getSubCategoriesController,
  getSubCategoryByIdController,
  getSubCategoryBySlugController,
  updateSubCategoryActiveController,
  updateSubCategoryController,
} from "./subCategories.controller.js";

const router = express.Router();

router.get("/admin", authenticateToken, adminAuth, getSubCategoriesAdminController);
router.get(
  "/admin/:id",
  authenticateToken,
  adminAuth,
  getSubCategoryByIdController,
);

router.post(
  "/",
  authenticateToken,
  adminAuth,
  upload.fields([
    { name: "imageUrl", maxCount: 1 },
    { name: "bannerUrl", maxCount: 1 },
  ]),
  createSubCategoryController,
);

router.put(
  "/:id",
  authenticateToken,
  adminAuth,
  upload.fields([
    { name: "imageUrl", maxCount: 1 },
    { name: "bannerUrl", maxCount: 1 },
  ]),
  updateSubCategoryController,
);

router.patch(
  "/active/:id",
  authenticateToken,
  adminAuth,
  updateSubCategoryActiveController,
);
router.delete("/:id", authenticateToken, adminAuth, deleteSubCategoryController);

router.get("/", getSubCategoriesController);
router.get("/:slug", getSubCategoryBySlugController);

export default router;
