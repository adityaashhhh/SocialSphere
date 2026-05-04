import { Router } from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../lib/cloudinary.js";
import { authMiddleware } from "../middlewares/auth.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../../public/uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const router = Router();

// Configure storage
const isCloudinaryConfigured = !!(
  process.env["CLOUDINARY_CLOUD_NAME"] &&
  process.env["CLOUDINARY_API_KEY"] &&
  process.env["CLOUDINARY_API_SECRET"]
);

let storage;

if (isCloudinaryConfigured) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "socialsphere",
      allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
    } as any,
  });
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  });
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.post("/", authMiddleware, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  let url: string;
  if (isCloudinaryConfigured) {
    url = (req.file as any).path;
  } else {
    // For local storage, we return a relative URL that will be served by express.static
    url = `/uploads/${req.file.filename}`;
  }

  res.json({
    url,
    type: req.file.mimetype.startsWith("video") ? "video" : "image",
    filename: req.file.filename,
  });
});

export default router;
