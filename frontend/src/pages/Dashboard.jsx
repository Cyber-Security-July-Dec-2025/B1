import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Added for React Router navigation
import api from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiDownload, FiTrash2, FiFileText, FiPlus } from "react-icons/fi"; // Added FiPlus icon

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data } = await api.get("/files");
        setFiles(data);
        console.log("Fetched files:", data);
      } catch (error) {
        console.error(error.response?.data || error.message);
      }
    };
    fetchFiles();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/files/${id}`);
      setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };

  // ✅ Detect if input is HEX or BASE64 and convert to ArrayBuffer
  const stringToArrayBuffer = (str) => {
    // If hex (only 0-9a-f chars and even length)
    if (/^[0-9a-fA-F]+$/.test(str) && str.length % 2 === 0) {
      const bytes = new Uint8Array(str.length / 2);
      for (let i = 0; i < str.length; i += 2) {
        bytes[i / 2] = parseInt(str.substr(i, 2), 16);
      }
      return bytes.buffer;
    }
    // Otherwise assume Base64
    const binary = atob(str);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const handleDownload = async (id) => {
    try {
      const { data } = await api.get(`/files/${id}`);
      console.log("Download payload:", data);

      const { fileName, encryptedAESKey, fileContent, iv, hashDigest } = data;

      // 1. Prompt user for private key
      const privateKeyHex = prompt(
        "Enter your private key (Hex format) to decrypt this file"
      );
      if (!privateKeyHex) throw new Error("Private key is required.");

      // Helpers
      function hexToArrayBuffer(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes.buffer;
      }
      function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
      }

      // 2. Import private RSA key
      const privateKeyBuffer = hexToArrayBuffer(privateKeyHex);
      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        privateKeyBuffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["decrypt"]
      );

      // 3. Decrypt AES key
      const encryptedKeyBuffer = base64ToArrayBuffer(encryptedAESKey);
      const rawAesKey = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedKeyBuffer
      );

      const aesKey = await crypto.subtle.importKey(
        "raw",
        rawAesKey,
        { name: "AES-GCM" },
        true,
        ["decrypt"]
      );

      // 4. Decrypt file content
      const ivBuffer = base64ToArrayBuffer(iv);
      const ciphertextBuffer = base64ToArrayBuffer(fileContent);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
        aesKey,
        ciphertextBuffer
      );

      // 5. Separate file data and appended hash
      const decoder = new TextDecoder();
      const decryptedBytes = new Uint8Array(decryptedBuffer);

      // The original hash was encoded as hex string using TextEncoder at upload
      const hashByteLength = new TextEncoder().encode(hashDigest).length;

      const fileBytes = decryptedBytes.slice(
        0,
        decryptedBytes.length - hashByteLength
      );
      const storedHashBytes = decryptedBytes.slice(
        decryptedBytes.length - hashByteLength
      );
      const storedHash = decoder.decode(storedHashBytes);

      // 6. Compute new SHA-256 hash of file content
      const newHashBuffer = await crypto.subtle.digest("SHA-256", fileBytes);
      const newHashHex = Array.from(new Uint8Array(newHashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // 7. Compare hashes
      if (newHashHex === storedHash) {
        console.log("✅ File is intact. Downloading...");

        // Download only file content (without appended hash)
        const blob = new Blob([fileBytes]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        alert("❌ File has been tampered with! Download aborted.");
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file. Check your private key and formats.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Header Section */}
          <header className="flex items-center justify-between border-b border-gray-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FiFileText className="text-indigo-600 text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Files</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Secure file storage and management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {files.length} file{files.length !== 1 ? "s" : ""}
              </span>
              <Button
                onClick={() => navigate("/upload")}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiPlus className="text-lg" />
                Upload New File
              </Button>
            </div>
          </header>

          {/* Files Grid */}
          <div className="space-y-4">
            {files.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <FiFileText className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No files found
                </h3>
                <p className="text-gray-500 mb-6">
                  Upload your first file to get started
                </p>
                <Button
                  onClick={() => navigate("/upload")}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors mx-auto"
                >
                  <FiPlus className="text-lg" />
                  Upload File
                </Button>
              </div>
            ) : (
              files.map((file, index) => (
                <Card
                  key={file._id}
                  className="group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-indigo-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-3 bg-indigo-50 rounded-lg">
                          <FiFileText className="text-indigo-600 text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 truncate">
                            {file.fileName}
                          </h3>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-medium">Hash:</span>
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs break-all">
                                {file.hashDigest}
                              </span>
                            </div>
                            {file.size && (
                              <div className="text-xs text-gray-500">
                                <span className="font-medium">Size:</span>{" "}
                                {(file.size / 1024).toFixed(2)} KB
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                          onClick={() => handleDownload(file._id)}
                        >
                          <FiDownload className="text-base" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                          onClick={() => handleDelete(file._id)}
                        >
                          <FiTrash2 className="text-base" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
