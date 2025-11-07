import dotenv from "dotenv";
import mongoose from "mongoose";
import Admin from "./models/Admin.js";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const create = async () => {
  try {
    const email = "admin@backspace.co.in";
    const password = "Admin18"; // plain text password

    const exists = await Admin.findOne({ email });
    if (exists) {
      console.log("⚠️ Admin already exists");
      process.exit();
    }

    await Admin.create({ email, password });

    console.log("✅ Admin created successfully (no hashing)");
    process.exit();
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
};

create();
