import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FiUpload, FiArrowLeft, FiFile } from "react-icons/fi"; // Added icons
import api from "@/lib/axios";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [customFileName, setCustomFileName] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // ✅ Helper: ArrayBuffer → Base64
  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000; // avoid call stack issues
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  };

  const handleUpload = async () => {
    if (!file || !customFileName) {
      toast({
        title: "Missing info",
        description: "Please select a file and enter a file name",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("fileName", customFileName);

      // ---------------------------
      // 1. Get RSA Public Key from localStorage
      // ---------------------------
      function hexToArrayBuffer(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes.buffer;
      }

      // Usage:
      const publicKeyHex = localStorage.getItem("publicKey");
      const publicKeyBuffer = hexToArrayBuffer(publicKeyHex);
      const publicKeyObj = await crypto.subtle.importKey(
        "spki",
        publicKeyBuffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
      );
      
      // ---------------------------
      // 2. Generate AES key + IV
      // ---------------------------
      const aesKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // ---------------------------
      // 3. Read file and compute SHA-256 hash
      // ---------------------------
      const fileArrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", fileArrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // ---------------------------
      // 4. Concatenate file + hash
      // ---------------------------
      const encoder = new TextEncoder();
      const hashBytes = encoder.encode(hashHex);
      const combinedBuffer = new Uint8Array(
        fileArrayBuffer.byteLength + hashBytes.byteLength
      );
      combinedBuffer.set(new Uint8Array(fileArrayBuffer), 0);
      combinedBuffer.set(hashBytes, fileArrayBuffer.byteLength);

      // ---------------------------
      // 5. Encrypt combined data with AES-GCM
      // ---------------------------
      const encryptedContent = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        aesKey,
        combinedBuffer
      );

      // ---------------------------
      // 6. Encrypt AES key with RSA public key
      // ---------------------------
      const encryptedAESKey = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKeyObj,
        rawAesKey
      );

      // ---------------------------
      // 7. Append to formData
      // ---------------------------
      formData.append("file", new Blob([encryptedContent]), customFileName);
      formData.append("fileName", customFileName); // only once
      formData.append("encryptedAESKey", arrayBufferToBase64(encryptedAESKey));
      formData.append("iv", arrayBufferToBase64(iv));
      formData.append("hashDigest", hashHex); // send SHA-256 separately

      // ---------------------------
      // 8. Upload to backend
      // ---------------------------
      const token = localStorage.getItem("token");

      await api.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: "Upload Successful ✅",
        description: `${customFileName} has been uploaded securely.`,
      });
      navigate('/');
      setFile(null);
      setCustomFileName("");
    } catch (error) {
      toast({
        title: "Upload Failed ❌",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="p-3 bg-indigo-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <FiUpload className="text-indigo-600 text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload File</h1>
          <p className="text-gray-500">Securely store your files with encryption</p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Name
            </label>
            <Input
              type="text"
              placeholder="Enter a custom file name"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              className="w-full border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <div className="relative">
              <Input
                type="file"
                onChange={handleFileChange}
                className="w-full border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {file && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <FiFile className="text-indigo-600" />
                  <span>{file.name}</span>
                  <span className="text-gray-400">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleUpload}
              disabled={!file || !customFileName}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FiUpload className="text-lg" />
              Upload File
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FiArrowLeft className="text-lg" />
              Back
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <p>Files are encrypted with AES-256 and RSA-OAEP for maximum security</p>
        </div>
      </div>
    </div>
  );
}
