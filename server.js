import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: true, // 👈 reflects request origin automatically
    credentials: true,
  })
);


app.use("/api/admin", adminRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/contact", contactRoutes);
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
