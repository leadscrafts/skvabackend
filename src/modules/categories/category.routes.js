import express from "express";
import upload from "../../middleware/uploadMiddleware.js";
import {
  authenticateToken,
  adminAuth,
} from "../../middleware/authMiddleware.js";
import {
  getCategories,
  getCategoriesAdmin,
  getCategoryDetailsById,
  getCategoryDetailsBySlug,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "./category.controller.js";

const router = express.Router();

router.get("/admin", authenticateToken, adminAuth, getCategoriesAdmin);
router.get("/admin/:id", authenticateToken, adminAuth, getCategoryDetailsById);

router.post(
  "/",
  authenticateToken,
  adminAuth,
  upload.fields([
    { name: "imageUrl", maxCount: 1 },
    { name: "bannerUrl", maxCount: 1 },
  ]),
  createCategoryController,
);

router.put(
  "/:id",
  authenticateToken,
  adminAuth,
  upload.fields([
    { name: "imageUrl", maxCount: 1 },
    { name: "bannerUrl", maxCount: 1 },
  ]),
  updateCategoryController,
);

router.delete("/:id", authenticateToken, adminAuth, deleteCategoryController);

router.get("/", getCategories);
router.get("/:slug", getCategoryDetailsBySlug);

export default router;
