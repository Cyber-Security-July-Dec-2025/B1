import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/users/login", { email, password });
      
      if (response.success) {
        localStorage.setItem("token", response.token);
        
        const publicKey = getStoredPublicKey();
        if (!publicKey) {
          setError("Public key not found. Please register again or import your keys.");
          return;
        }

        setIsLoggedIn(true);
        console.log("Login successful");
      } else {
        setError("Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const simulateApiCall = async (endpoint, data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, token: "mock-jwt-token", user: { email: data.email } });
      }, 1000);
    });
  };

  const getStoredPublicKey = () => {
    return "mock-public-key-exists";
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome Back!</h2>
          <p className="text-gray-600 text-lg mb-8">You have successfully logged in to <span className="font-semibold text-indigo-600">FileHandler</span>.</p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg shadow-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
        {/* Header with Branding */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              FileHandler
            </h1>
            <p className="text-gray-600 text-lg">Secure File Management</p>
          </div>
          
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to access your secure files</p>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
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

          <button
            onClick={handleLogin}
            disabled={isLoading || !email || !password}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Signing In...
              </div>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Action Links */}
          <div className="flex items-center justify-between pt-2">
            <button 
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              onClick={() => alert('Forgot Password flow here')}
            >
              Forgot Password?
            </button>
            <button 
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              onClick={() => alert('Import Keys flow here')}
            >
              Import Keys
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              Don't have an account?
            </p>
            <button
              className="w-full bg-white text-indigo-600 border-2 border-indigo-600 py-3 px-4 rounded-lg hover:bg-indigo-50 transition-colors font-semibold"
              onClick={() => navigate('/register')}
            >
              Create New Account
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-indigo-800 mb-1">Security Notice</h4>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Your files are encrypted with your private key. Ensure you have access to your private key before proceeding with file operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
