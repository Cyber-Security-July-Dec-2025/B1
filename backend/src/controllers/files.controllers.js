import File from "../models/files.models.js";
import { getKeyPair } from "../utils/keys.js";
import fs from "fs";

// @desc    Upload encrypted file
// @route   POST /api/files/upload
// @access  Private
import path from "path";

export const uploadFile = async (req, res) => {
  try {
    const { encryptedAESKey, iv, fileName: rawFileName, hashDigest } = req.body;

// Fix array issue
    const fileName = Array.isArray(rawFileName) ? rawFileName[0] : rawFileName;

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!encryptedAESKey || !iv || !hashDigest || !fileName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const file = new File({
      owner: req.user._id,
      fileName,
      encryptedAESKey,
      iv,
      hashDigest,
      filePath: req.file.path,
    });

    await file.save();

    res.status(201).json({
      message: "File uploaded successfully",
      fileId: file._id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download encrypted file
// @route   GET /api/files/:id
// @access  Private
export const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    if (file.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const filePath = path.resolve(file.filePath);

    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    // Read file contents (ciphertext)
    const fileBuffer = fs.readFileSync(filePath);

    // Send metadata + file content in JSON
    res.json({
      fileName: file.fileName,
      encryptedAESKey: file.encryptedAESKey,
      hashDigest: file.hashDigest,
      iv: file.iv,
      fileContent: fileBuffer.toString("base64"), // base64 encoding
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete encrypted file
// @route   DELETE /api/files/:id
// @access  Private
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    if (file.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Delete file from disk
    fs.unlinkSync(file.filePath);

    await file.deleteOne();

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all files of logged-in user
// @route   GET /api/files
// @access  Private
export const getUserFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id }).select(
      "fileName hashDigest createdAt"
    );

    res.json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Public RSA Key
// @route   GET /api/files/public-key
// @access  Public
export const getPublicKey = (req, res) => {
  try {
    const { publicKey } = getKeyPair();
    res.status(200).json({ publicKey });
  } catch (err) {
    console.error("Public key error:", err);
    res.status(500).json({ message: "Error generating public key" });
  }
};
