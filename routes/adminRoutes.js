import express from "express";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import PasswordResetToken from "../models/PasswordResetToken.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const passwordIsValid = (password) => typeof password === "string" && password.length >= 12;
const emailIsValid = (email) => typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const sanitizeSmtpError = (error) => ({
  name: error?.name,
  code: error?.code,
  command: error?.command,
  responseCode: error?.responseCode,
  response: error?.response,
  errno: error?.errno,
  syscall: error?.syscall,
  address: error?.address,
  port: error?.port,
  host: process.env.SMTP_HOST,
  configuredPort: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
});

function getMailer() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.MAIL_FROM) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

// =============================
// 🔹 Admin Registration Route
// =============================
router.post("/create-admin", protect, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!emailIsValid(email) || !passwordIsValid(password)) {
      return res.status(400).json({ success: false, message: "A valid email and a password of at least 12 characters are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingAdmin = await Admin.findOne({ email: normalizedEmail });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: "Admin already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({ email: normalizedEmail, password: hashedPassword, role: "admin" });

    return res.status(201).json({ success: true, message: "Admin registered successfully!" });
  } catch (error) {
    console.error("Error during admin registration:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =============================
// 🔹 Admin Login Route (example)
// =============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin || admin.disabledAt) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password." });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role, tokenVersion: admin.tokenVersion }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({ success: true, message: "Login successful", token });
  } catch (error) {
    console.error("Error during admin login:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


// =============================
// 🔹 Get Logged-in Admin
// =============================
router.get("/me", protect, (req, res) => {
  res.json({
    isAuthenticated: true,
    admin: {
    id: req.admin._id,
    email: req.admin.email,
    role: req.admin.role,
    },
  });
});

router.post("/logout", protect, async (req, res) => {
  await Admin.updateOne({ _id: req.admin._id }, { $inc: { tokenVersion: 1 } });
  res.json({ success: true });
});

router.post("/forgot-password", async (req, res) => {
  const genericResponse = { success: true, message: "If that account exists, a reset link has been sent." };

  try {
    const email = typeof req.body.email === "string" ? req.body.email.toLowerCase().trim() : "";
    const admin = emailIsValid(email) ? await Admin.findOne({ email, disabledAt: null }) : null;

    if (admin) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      await PasswordResetToken.deleteMany({ adminId: admin._id, usedAt: null });
      const resetTokenRecord = await PasswordResetToken.create({
        adminId: admin._id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      const mailer = getMailer();
      if (!mailer) {
        await PasswordResetToken.deleteOne({ _id: resetTokenRecord._id });
        console.error("Password recovery delivery failed", {
          reason: "SMTP configuration incomplete",
          hasHost: Boolean(process.env.SMTP_HOST),
          hasUser: Boolean(process.env.SMTP_USER),
          hasPassword: Boolean(process.env.SMTP_PASSWORD),
          hasMailFrom: Boolean(process.env.MAIL_FROM),
        });
        return res.json(genericResponse);
      }

      try {
        await mailer.sendMail({
          from: process.env.MAIL_FROM,
          to: admin.email,
          subject: "Reset your Backspace admin password",
          text: `Use this link within 15 minutes to reset your password: ${process.env.RESET_URL}?token=${rawToken}`,
        });
      } catch (error) {
        console.error("Password recovery delivery failed", sanitizeSmtpError(error));
        await PasswordResetToken.deleteOne({ _id: resetTokenRecord._id }).catch(() => undefined);
      }
    }

    return res.json(genericResponse);
  } catch {
    console.error("Password recovery request failed");
    return res.json(genericResponse);
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (typeof token !== "string" || !passwordIsValid(password)) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset request." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetToken = await PasswordResetToken.findOne({ tokenHash, usedAt: null, expiresAt: { $gt: new Date() } });
    if (!resetToken) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset request." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await Admin.findOneAndUpdate(
      { _id: resetToken.adminId, disabledAt: null },
      { password: passwordHash, $inc: { tokenVersion: 1 } },
      { new: true }
    );
    if (!admin) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset request." });
    }

    await PasswordResetToken.updateOne({ _id: resetToken._id }, { usedAt: new Date() });
    return res.json({ success: true, message: "Password reset successfully." });
  } catch {
    console.error("Password reset request failed");
    return res.status(400).json({ success: false, message: "Invalid or expired reset request." });
  }
});

router.patch("/:id/disable", protect, async (req, res) => {
  if (req.admin.role !== "super_admin") {
    return res.status(403).json({ success: false, message: "Super admin access required." });
  }
  if (String(req.admin._id) === req.params.id) {
    return res.status(400).json({ success: false, message: "You cannot disable your own account." });
  }

  const admin = await Admin.findByIdAndUpdate(
    req.params.id,
    { disabledAt: new Date(), $inc: { tokenVersion: 1 } },
    { new: true }
  ).select("_id disabledAt");
  return admin
    ? res.json({ success: true, message: "Admin disabled." })
    : res.status(404).json({ success: false, message: "Admin not found." });
});

export default router;
