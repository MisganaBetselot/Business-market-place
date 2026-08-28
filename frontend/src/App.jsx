import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./auth/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import ResetPassword from "./pages/public/ResetPassword";
import Dashboard from "./pages/account/Dashboard";
import Profile from "./pages/account/Profile";
import ComingSoon from "./pages/_stubs/ComingSoon";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppShell />}>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Requires login — this branch's pages */}
            <Route element={<ProtectedRoute />}>
              <Route path="/account" element={<Dashboard />} />
              <Route path="/account/profile" element={<Profile />} />
            </Route>

            {/* Placeholders for other modules — replace as each lands */}
            <Route path="/favorites" element={<ComingSoon title="Favorites" owner="Muni" />} />
            <Route path="/notifications" element={<ComingSoon title="Notifications" owner="msgana" />} />
            <Route path="/admin" element={<ComingSoon title="Admin panel" owner="msgana" />} />
            <Route path="/seller" element={<ComingSoon title="Seller tools" owner="Dre" />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
