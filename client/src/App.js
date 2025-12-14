import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Register from "./pages/register";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Feed from "./pages/feed";
import Faq from "./pages/faq";
import Videogen from "./pages/videogen";
import UploadVideo from "./pages/UploadVideo";
import ToolsPage from "./pages/ToolsPage";
import TimeCapsuleForm from "./pages/TimeCapsuleForm";
import CreateProfile from "./pages/CreateProfile";
import VerifyCode from "./pages/VerifyCode";
import ForgotPassword from "./pages/ForgotPassword";
import Remover from "./pages/Remover";
import UpscaleOptionPage from "./pages/UpscaleOptionPage";
import Download from "./pages/Download";
import Timeline from "./pages/Timeline";
import Past from "./pages/Past";
import Curent from "./pages/Curent";
import Future from "./pages/Future";


import ProtectedRoute from "./components/ProtectedRoute";
import { useSession } from "./context/SessionContext";

/* =========================
   ROOT REDIRECT
========================= */
function IndexRedirect() {
  const { isLogin } = useSession();
  return <Navigate to={isLogin ? "/feed" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>

      {/* ROOT */}
      <Route path="/" element={<IndexRedirect />} />

      {/* =====================
          PUBLIC ROUTES
      ====================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* =====================
          PROTECTED ROUTES
      ====================== */}
      <Route
        path="/verifycode"
        element={
          <ProtectedRoute>
            <VerifyCode />
          </ProtectedRoute>
        }
      />

      <Route
        path="/forgotpassword"
        element={
          <ProtectedRoute>
            <ForgotPassword />
          </ProtectedRoute>
        }
      />

      <Route
        path="/createprofile"
        element={
          <ProtectedRoute>
            <CreateProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        }
      />

      <Route
        path="/faq"
        element={
          <ProtectedRoute>
            <Faq />
          </ProtectedRoute>
        }
      />

      <Route
        path="/videogen"
        element={
          <ProtectedRoute>
            <Videogen />
          </ProtectedRoute>
        }
      />

      <Route
        path="/uploadvideo"
        element={
          <ProtectedRoute>
            <UploadVideo />
          </ProtectedRoute>
        }
      />

      <Route
        path="/toolspage"
        element={
          <ProtectedRoute>
            <ToolsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/timecapsuleform"
        element={
          <ProtectedRoute>
            <TimeCapsuleForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/timeline"
        element={
          <ProtectedRoute>
            <Timeline />
          </ProtectedRoute>
        }
      />

      <Route
        path="/past"
        element={
          <ProtectedRoute>
            <Past />
          </ProtectedRoute>
        }
      />

      <Route
        path="/curent"
        element={
          <ProtectedRoute>
            <Curent />
          </ProtectedRoute>
        }
      />

      <Route
        path="/future"
        element={
          <ProtectedRoute>
            <Future />
          </ProtectedRoute>
        }
      />

      <Route
        path="/remover"
        element={
          <ProtectedRoute>
            <Remover />
          </ProtectedRoute>
        }
      />

      <Route
        path="/upscaleoptionpage"
        element={
          <ProtectedRoute>
            <UpscaleOptionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/download"
        element={
          <ProtectedRoute>
            <Download />
          </ProtectedRoute>
        }
      />

      {/* =====================
          404
      ====================== */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}
