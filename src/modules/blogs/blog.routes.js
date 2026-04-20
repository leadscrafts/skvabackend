import express from "express";
import upload from "../../middleware/uploadMiddleware.js";
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  getAllBlogPostsAdmin,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  updatePublish,
} from "./blog.controller.js";
import {
  authenticateToken,
  adminAuth,
} from "../../middleware/authMiddleware.js";

const router = express.Router();

// Admin routes
router.get("/admin", authenticateToken, adminAuth, getAllBlogPostsAdmin);
router.get("/admin/:id", authenticateToken, adminAuth, getBlogPostById);
router.post(
  "/",
  authenticateToken,
  adminAuth,
  upload.single("featuredImage"),
  createBlogPost,
);
router.put(
  "/:id",
  authenticateToken,
  adminAuth,
  upload.single("featuredImage"),
  updateBlogPost,
);
router.delete("/:id", authenticateToken, adminAuth, deleteBlogPost);
router.patch("/publish/:id", authenticateToken, adminAuth, updatePublish);

//public routes
router.get("/", getAllBlogPosts);
router.get("/:slug", getBlogPostBySlug);

export default router;
