import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiUserPlus, FiKey, FiDownload, FiArrowLeft } from "react-icons/fi";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [privateKeyHex, setPrivateKeyHex] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data } = await api.post("/users/register", { email, password });
      localStorage.setItem("token", data.token);
      console.log("Registered:", data);

      // Generate RSA key pair after successful registration
      await generateRSAKeyPair();
    } catch (error) {
      console.error(error.response?.data || error.message);
      setError(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate RSA Key Pair (RSA-OAEP with SHA-256)
  const generateRSAKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: "SHA-256",
      },
      true, // extractable
      ["encrypt", "decrypt"]
    );

    // Export public key and save in localStorage
    const publicKeyData = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyHex = bufferToHex(publicKeyData);
    localStorage.setItem("publicKey", publicKeyHex);

    // Export private key and show to user (DO NOT STORE)
    const privateKeyData = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const privateKeyHex = bufferToHex(privateKeyData);
    setPrivateKeyHex(privateKeyHex);
  };

  // Helper: Convert ArrayBuffer → Hex string
  const bufferToHex = (buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const downloadPrivateKey = () => {
    const element = document.createElement("a");
    const file = new Blob([privateKeyHex], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${email}_private_key.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(privateKeyHex);
    alert("Private key copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            FileHandler
          </h1>
          <p className="text-gray-600 text-lg">Secure File Management</p>
        </div>

        <Card className="bg-white rounded-2xl shadow-2xl border border-gray-100">
          <CardHeader className="text-center pb-6">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUserPlus className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Join FileHandler for secure file storage</p>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-6">
            {!privateKeyHex ? (
              <>
                {/* Registration Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <Input
                      placeholder="Create a password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                    <Input
                      placeholder="Confirm your password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p className="text-sm text-red-800 font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-4 rounded-lg transition-all font-semibold text-lg shadow-lg"
                    onClick={handleRegister}
                    disabled={isLoading || !email || !password || !confirmPassword}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                        Creating Account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  {/* Login Link */}
                  <div className="text-center pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">
                      Already have an account?
                    </p>
                    <button
                      className="w-full bg-white text-indigo-600 border-2 border-indigo-600 py-3 px-4 rounded-lg hover:bg-indigo-50 transition-colors font-semibold flex items-center justify-center gap-2"
                      onClick={() => navigate('/login')}
                    >
                      <FiArrowLeft className="text-lg" />
                      Back to Login
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Private Key Display */}
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiKey className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
                    <p className="text-gray-600 mb-4">Your account has been created and your encryption keys generated.</p>
                  </div>

                  <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.134 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                      <p className="text-lg font-bold text-red-700">Critical: Save Your Private Key</p>
                    </div>
                    <p className="text-sm text-red-700 mb-4">
                      This private key is required to decrypt your files. Store it securely - we cannot recover it if lost!
                    </p>
                    
                    <div className="bg-white border border-red-200 rounded-lg p-3 mb-4">
                      <textarea
                        className="w-full h-32 text-xs font-mono resize-none border-0 outline-none"
                        readOnly
                        value={privateKeyHex}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 text-red-600 border-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                        onClick={downloadPrivateKey}
                      >
                        <FiDownload className="text-lg" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                        onClick={copyToClipboard}
                      >
                        Copy Key
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-4 rounded-lg transition-colors font-semibold text-lg shadow-lg"
                    onClick={() => navigate('/')}
                  >
                    Continue to DashBoard
                  </Button>
                </div>
              </>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-indigo-800 mb-1">End-to-End Encryption</h4>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Your files are encrypted client-side with RSA-OAEP and AES-256. Only you have access to your private key.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
