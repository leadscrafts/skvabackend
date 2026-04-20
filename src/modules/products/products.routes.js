import express from "express";
import upload from "../../middleware/uploadMiddleware.js";
import {
  adminAuth,
  authenticateToken,
} from "../../middleware/authMiddleware.js";
import {
  createProductController,
  deleteProductController,
  getProductByIdController,
  getProductBySlugController,
  getProductsAdminController,
  getProductsController,
  updateProductActiveController,
  updateProductController,
  updateProductFeaturedController,
} from "./products.controller.js";

const router = express.Router();

router.get("/admin", authenticateToken, adminAuth, getProductsAdminController);
router.get("/admin/:id", authenticateToken, adminAuth, getProductByIdController);

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

router.get("/", getProductsController);
router.get("/:slug", getProductBySlugController);

export default router;
