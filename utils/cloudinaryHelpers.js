import cloudinary from "../config/cloudinary.js";

export const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    const parts = imageUrl.split("/");
    const file = parts.pop(); // abc.jpg
    const folder = parts.slice(parts.indexOf("upload") + 2).join("/");
    const publicId = `${folder}/${file.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};
