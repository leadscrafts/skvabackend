import express from "express";
import upload, { brochureUpload } from "../../middleware/uploadMiddleware.js";
import {
  adminAuth,
  authenticateToken,
} from "../../middleware/authMiddleware.js";
import {
  createProductController,
  deleteProductController,
  getBrochureController,
  getProductByIdController,
  getProductBySlugController,
  getProductsAdminController,
  getProductsController,
  removeBrochureController,
  updateProductActiveController,
  updateProductController,
  updateProductFeaturedController,
  uploadBrochureController,
} from "./products.controller.js";

const router = express.Router();

router.get("/admin", authenticateToken, adminAuth, getProductsAdminController);
router.get(
  "/admin/:id",
  authenticateToken,
  adminAuth,
  getProductByIdController,
);

router.post(
  "/",
  authenticateToken,
  adminAuth,
  upload.array("galleryImages", 10),
  createProductController,
);

router.put(
  "/:id",
  authenticateToken,
  adminAuth,
  upload.array("galleryImages", 10),
  updateProductController,
);

router.patch(
  "/active/:id",
  authenticateToken,
  adminAuth,
  updateProductActiveController,
);

router.patch(
  "/featured/:id",
  authenticateToken,
  adminAuth,
  updateProductFeaturedController,
);

router.delete("/:id", authenticateToken, adminAuth, deleteProductController);

router.get("/:id/brochure", getBrochureController);

router.post(
  "/:id/brochure",
  authenticateToken,
  adminAuth,
  brochureUpload.single("brochure"),
  uploadBrochureController,
);

router.delete(
  "/:id/brochure",
  authenticateToken,
  adminAuth,
  removeBrochureController,
);

router.get("/", getProductsController);
router.get("/:slug", getProductBySlugController);

export default router;
