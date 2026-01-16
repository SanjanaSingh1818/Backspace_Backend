import express from "express";
import Workspace from "../models/Workspace.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// ==============================
// GET /api/workspaces
// ==============================
router.get("/", async (req, res) => {
  try {
    const workspaces = await Workspace.find().sort({ sort_order: 1 });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workspaces" });
  }
});

// ==============================
// POST /api/workspaces
// Supports: image upload OR image URL
// ==============================
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let imageUrl;

    // ✅ Case 1: Device image upload
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    // ✅ Case 2: Image URL
    else if (req.body.image_url) {
      imageUrl = req.body.image_url;
    } else {
      return res.status(400).json({ message: "Image is required" });
    }

    const workspace = await Workspace.create({
      title: req.body.title,
      description: req.body.description,
      image_url: imageUrl,
      price: req.body.price,
      discount: req.body.discount || 0,
      pricing_type: req.body.pricing_type, // per_hour | per_day | per_month
      cta_text: req.body.cta_text || "Book Now",
      cta_url: req.body.cta_url || "#",
      is_active: req.body.is_active ?? false,
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error("❌ Error creating workspace:", error);
    res.status(400).json({ message: error.message });
  }
});

// ==============================
// PUT /api/workspaces/:id
// ==============================
router.put("/:id", async (req, res) => {
  try {
    const updated = await Workspace.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("❌ Error updating workspace:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// DELETE /api/workspaces/:id
// ==============================
router.delete("/:id", protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: "Workspace not found." });
    }

    await workspace.deleteOne();

    res.json({
      success: true,
      message: "Workspace deleted successfully.",
    });
  } catch (error) {
    console.error("❌ Error deleting workspace:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting workspace.",
    });
  }
});

export default router;
