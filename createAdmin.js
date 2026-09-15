import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const create = async () => {
  try {
    const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_SECRET } = process.env;

    if (!ADMIN_SECRET || ADMIN_SECRET.length < 16) {
      throw new Error("ADMIN_SECRET must be configured in the server environment");
    }
    if (!email || !password || password.length < 12) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured; password must be at least 12 characters");
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      console.log("⚠️ Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await Admin.create({ email, password: hashedPassword, role: "admin", tokenVersion: 0 });

    console.log("✅ Admin created successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
};

create();
