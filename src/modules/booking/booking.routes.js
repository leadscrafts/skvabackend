import express from "express";
import {
  adminAuth,
  authenticateToken,
} from "../../middleware/authMiddleware.js";
import {
  createBookingController,
  deleteBookingController,
  getBookingByIdController,
  getBookingsController,
  updateBookingStatusController,
} from "./booking.controller.js";

const router = express.Router();

router.get("/admin", authenticateToken, adminAuth, getBookingsController);
router.get(
  "/admin/:id",
  authenticateToken,
  adminAuth,
  getBookingByIdController,
);
router.patch(
  "/status/:id",
  authenticateToken,
  adminAuth,
  updateBookingStatusController,
);
router.delete("/:id", authenticateToken, adminAuth, deleteBookingController);

router.post("/", createBookingController);

export default router;
