
import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, required: true },
    service_interest: { type: String },
    status: { type: String, default: "pending" },
    remark: { type: String, default: "" },

  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },

  }
);

export default mongoose.model("Contact", contactSchema);
