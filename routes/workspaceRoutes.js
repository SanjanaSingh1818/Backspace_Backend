import express from "express";
import Workspace from "../models/Workspace.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/cloudinaryUpload.js";
import { deleteFromCloudinary } from "../utils/cloudinaryHelpers.js";

const router = express.Router();

/* ==============================
   GET ALL WORKSPACES
============================== */
router.get("/", async (req, res) => {
  try {
    const workspaces = await Workspace.find().sort({ createdAt: -1 });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workspaces" });
  }
});

/* ==============================
   GET SINGLE WORKSPACE
============================== */
router.get("/:id", async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workspace" });
  }
});

/* ==============================
   CREATE WORKSPACE
============================== */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    // 🔒 Validate image
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "Image upload failed" });
    }

    // 🔒 Validate pricing_type
    if (!req.body.pricing_type) {
      return res.status(400).json({ message: "pricing_type is required" });
    }
console.log("BODY:", req.body);
console.log("FILE:", req.file);

    const workspace = await Workspace.create({
      title: req.body.title,
      description: req.body.description,
      image_url: req.file.path, // Cloudinary URL
      price: Number(req.body.price),
      discount: Number(req.body.discount) || 0,
      pricing_type: req.body.pricing_type,
      cta_text: req.body.cta_text || "Book Now",
      cta_url: req.body.cta_url || "#",
      is_active: false,
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error("❌ CREATE WORKSPACE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});



/* ==============================
   UPDATE WORKSPACE (WITH IMAGE CLEANUP)
============================== */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    let imageUrl = workspace.image_url;

    // ✅ If new image uploaded → delete old one
    if (req.file) {
      await deleteFromCloudinary(workspace.image_url);
      imageUrl = req.file.path;
    }

    const updated = await Workspace.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        image_url: imageUrl,
        price: req.body.price,
        discount: req.body.discount || 0,
        pricing_type: req.body.pricing_type,
        cta_text: req.body.cta_text,
        cta_url: req.body.cta_url,
        is_active: req.body.is_active === "true" || req.body.is_active === true,
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.error("❌ UPDATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

/* ==============================
   DELETE WORKSPACE (WITH IMAGE DELETE)
============================== */
router.delete("/:id", protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found.",
      });
    }

    // ✅ Delete image from Cloudinary
    await deleteFromCloudinary(workspace.image_url);

    await workspace.deleteOne();

    res.json({
      success: true,
      message: "Workspace and image deleted successfully.",
    });
  } catch (error) {
    console.error("❌ DELETE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting workspace.",
    });
  }
});

export default router;
