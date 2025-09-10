import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    encryptedAESKey: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    hashDigest: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

export default mongoose.model("File", fileSchema);
