import express from "express";
import Workspace from "../models/Workspace.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

// GET /api/workspaces
router.get("/", async (req, res) => {
  const w = await Workspace.find().sort({ sort_order: 1 });
  res.json(w);
});

// POST /api/workspaces  (protected)
router.post("/", async (req, res) => {
  try {
    const workspace = await Workspace.create(req.body);
    res.status(201).json(workspace);
  } catch (error) {
    console.error("Error creating workspace:", error);
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/workspaces/:id  (protected)
router.put("/:id", async (req, res) => {
  try {
    const updated = await Workspace.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating workspace:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/workspaces/:id (protected)
router.delete("/:id", protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    // 🔹 If not found
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found." });
    }

    // 🔹 Delete the workspace
    await workspace.deleteOne();

    res.json({ success: true, message: "Workspace deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting workspace:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting workspace.",
    });
  }
});


export default router;
