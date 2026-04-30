import express from "express";
import {
  authenticateToken,
  adminAuth,
} from "../../middleware/authMiddleware.js";

import {
  getHomeVideoController,
  saveHomeVideoController,
  updateHomeVideoStatusController,
} from "./homeVideo.controller.js";

const router = express.Router();

router.get("/", getHomeVideoController);
router.post("/", authenticateToken, adminAuth, saveHomeVideoController);
router.patch(
  "/status",
  authenticateToken,
  adminAuth,
  updateHomeVideoStatusController,
);

export default router;
