import express from "express";
import {
  login,
  getMe,
  forgotPassword,
  verifyOTP,
  resetPasswordWithOTP,
} from "./auth.controller.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", authenticateToken, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPasswordWithOTP);

export default router;
