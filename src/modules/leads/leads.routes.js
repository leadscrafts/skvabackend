import express from "express";
import {
  adminAuth,
  authenticateToken,
} from "../../middleware/authMiddleware.js";
import {
  createLeadController,
  deleteLeadController,
  getLeadByIdController,
  getLeadsController,
  updateLeadStatusController,
} from "./leads.controller.js";

const router = express.Router();

router.get("/admin", authenticateToken, adminAuth, getLeadsController);
router.get("/admin/:id", authenticateToken, adminAuth, getLeadByIdController);
router.patch(
  "/status/:id",
  authenticateToken,
  adminAuth,
  updateLeadStatusController,
);
router.delete("/:id", authenticateToken, adminAuth, deleteLeadController);

router.post("/", createLeadController);

export default router;
