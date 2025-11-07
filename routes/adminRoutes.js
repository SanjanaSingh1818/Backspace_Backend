import express from "express";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js"; 
import jwt from "jsonwebtoken";

const router = express.Router();

// ✅ Admin Secret Key (must match frontend one)
const ADMIN_SECRET_KEY = "Sanju1";

// =============================
// 🔹 Admin Registration Route
// =============================
router.post("/register", async (req, res) => {
  try {
    const { email, password, secretKey } = req.body;

    if (secretKey !== ADMIN_SECRET_KEY) {
      return res.status(403).json({ success: false, message: "Invalid secret key." });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: "Admin already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({ email, password: hashedPassword });

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

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found." });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password." });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({ success: true, message: "Login successful", token });
  } catch (error) {
    console.error("Error during admin login:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
