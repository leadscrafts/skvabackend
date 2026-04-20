import {
  loginService,
  getMeService,
  forgotPasswordService,
  verifyOTPService,
  resetPasswordWithOTPService,
} from "./auth.service.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginService(email, password);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await getMeService(req.user.id);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch user",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await forgotPasswordService(email);

    res.status(200).json({
      success: true,
      message: result.message,
      email: result.email,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to process forgot password request",
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyOTPService(email, otp);

    res.status(200).json({
      success: true,
      message: result.message,
      resetToken: result.resetToken,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to verify OTP",
    });
  }
};

export const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const resetToken = req.headers.authorization?.split(" ")[1];

    const result = await resetPasswordWithOTPService(
      email,
      newPassword,
      resetToken,
    );

    res.status(200).json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
};
