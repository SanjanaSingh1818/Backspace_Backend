import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },

  // Image can be uploaded OR URL
  image_url: { type: String, required: true },

  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },

  // ✅ NEW FIELD (instead of location)
  pricing_type: {
    type: String,
    enum: ["per_hour", "per_day", "per_month"],
    required: true,
  },

  cta_text: { type: String, default: "Book Now" },
  cta_url: { type: String, default: "#" },
  is_active: { type: Boolean, default: false },
});

const Workspace = mongoose.model("Workspace", workspaceSchema);
export default Workspace;
