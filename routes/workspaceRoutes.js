import express from "express";
import Workspace from "../models/Workspace.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

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
    let imageUrl;

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.image_url) {
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
      pricing_type: req.body.pricing_type,
      cta_text: req.body.cta_text || "Book Now",
      cta_url: req.body.cta_url || "#",
      is_active: req.body.is_active ?? false,
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error("❌ CREATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

/* ==============================
   UPDATE WORKSPACE
============================== */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    let imageUrl;

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.image_url) {
      imageUrl = req.body.image_url;
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
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("❌ UPDATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

/* ==============================
   DELETE WORKSPACE
============================== */
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
    console.error("❌ DELETE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting workspace.",
    });
  }
});

export default router;
