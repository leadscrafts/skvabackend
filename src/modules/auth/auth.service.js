import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { throwError } from "../../utils/throwError.js";
import { generateOTP, sendForgotPasswordOTP } from "../../utils/email.js";

export const loginService = async (email, password) => {
  if (!email || !password) throwError("Email and password are required");
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throwError("Invalid credentials", 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throwError("Invalid credentials", 401);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};

export const getMeService = async (userId) => {
  if (!userId) throwError("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) throwError("User not found", 404);

  return user;
};

export const forgotPasswordService = async (email) => {
  if (!email) throwError("Email is required", 400);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throwError("User not found", 404);

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { email },
    data: {
      resetOtp: otp,
      resetOtpExpiry: otpExpiry,
    },
  });

  await sendForgotPasswordOTP(email, otp);

  return {
    message: "OTP sent to your email",
    email: email,
  };
};

export const verifyOTPService = async (email, otp) => {
  if (!email || !otp) throwError("Email and OTP are required", 400);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throwError("User not found", 404);

  if (!user.resetOtp || !user.resetOtpExpiry) {
    throwError("No OTP request found. Please request a new OTP", 400);
  }

  if (new Date() > user.resetOtpExpiry) {
    await prisma.user.update({
      where: { email },
      data: {
        resetOtp: null,
        resetOtpExpiry: null,
      },
    });
    throwError("OTP has expired. Please request a new OTP", 400);
  }

  if (user.resetOtp !== otp) {
    throwError("Invalid OTP", 401);
  }

  const resetToken = jwt.sign(
    { email: user.email, type: "password_reset" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  return {
    message: "OTP verified successfully",
    resetToken: resetToken,
  };
};

export const resetPasswordWithOTPService = async (email, newPassword, resetToken) => {
  if (!email || !newPassword || !resetToken) {
    throwError("Email, new password, and reset token are required", 400);
  }

  if (newPassword.length < 6) {
    throwError("Password must be at least 6 characters long", 400);
  }

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    if (decoded.type !== "password_reset" || decoded.email !== email) {
      throwError("Invalid or expired reset token", 401);
    }
  } catch (error) {
    throwError("Invalid or expired reset token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throwError("User not found", 404);

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      resetOtp: null,
      resetOtpExpiry: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return {
    message: "Password reset successfully",
    user: updatedUser,
  };
};
