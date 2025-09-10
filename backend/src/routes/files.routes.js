import express from "express";
import multer from "multer";
import { uploadFile, downloadFile, deleteFile , getUserFiles , getPublicKey } from "../controllers/files.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // store encrypted files
    
// Routes
router.post("/upload", verifyJWT, upload.single("file"), uploadFile);
router.get("/:id", verifyJWT, downloadFile);
router.delete("/:id", verifyJWT, deleteFile);
router.get("/", verifyJWT, getUserFiles);
router.get("/public-key", getPublicKey);
export default router;
