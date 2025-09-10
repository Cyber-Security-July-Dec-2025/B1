import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/Upload";

// Helper to check authentication
const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: isAuthenticated() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />,
  },
  {
    path: "/login",
    element: isAuthenticated() ? <Navigate to="/dashboard" /> : <LoginPage />,
  },
  {
    path: "/register",
    element: isAuthenticated() ? <Navigate to="/dashboard" /> : <RegisterPage />,
  },
  {
    path: "/dashboard",
    element: isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />,
  },
  {
    path: "/upload",
    element: isAuthenticated() ? <UploadPage /> : <Navigate to="/login" />,
  },
  {
    path: "*",
    element: <Navigate to="/" />,
  },
]);
