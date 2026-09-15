import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "super_admin"], default: "admin" },
    tokenVersion: { type: Number, default: 0 },
    disabledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
