import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image_url: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  location: { type: String, required: true },
  cta_text: { type: String, default: "Book Now" },
  cta_url: { type: String, default: "#" },
  is_active: { type: Boolean, default: false } // ✅ Added
});

const Workspace = mongoose.model("Workspace", workspaceSchema);
export default Workspace;
