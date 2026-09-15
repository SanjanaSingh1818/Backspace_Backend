import express from "express";
import Contact from "../models/Contact.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

// CREATE new contact
router.post("/", async (req, res) => {
  try {
    const c = await Contact.create(req.body);
    res.status(201).json(c);
  } catch (err) {
    res.status(500).json({ message: "Error saving contact", error: err });
  }
});

// GET all contacts
router.get("/", protect, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ created_at: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching contacts" });
  }
});

// ✅ UPDATE contact status
router.put("/:id", protect, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
        remark: req.body.remark,
      },
      { new: true }
    );

    if (!contact)
      return res.status(404).json({ message: "Contact not found" });

    res.json({
      success: true,
      message: "Contact updated successfully",
      contact,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating contact",
    });
  }
});


export default router;
