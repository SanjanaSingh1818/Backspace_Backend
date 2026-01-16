import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "backspace/workspaces", // folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 1200, crop: "limit" },
      { quality: "auto" },
    ],
  },
});

const upload = multer({ storage });

export default upload;
