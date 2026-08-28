import { createBrowserRouter } from "react-router-dom";
import SiteLayout from "../components/layout/SiteLayout";
import ProtectedRoute from "../auth/ProtectedRoute";

import Home from "../pages/public/Home";
import Search from "../pages/public/Search";
import BusinessDetails from "../pages/public/BusinessDetails";
import Login from "../pages/public/Login";
import Register from "../pages/public/Register";
import ResetPassword from "../pages/public/ResetPassword";
import Dashboard from "../pages/account/Dashboard";
import Profile from "../pages/account/Profile";
import Messages from "../pages/messages/Messages";
import SellerDashboard from "../pages/seller/SellerDashboard";
import SellerProducts from "../pages/seller/SellerProducts";
import SellerProfile from "../pages/seller/SellerProfile";

const router = createBrowserRouter([
  {
    path: "/",
    element: <SiteLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "search", element: <Search /> },
      { path: "business/:id", element: <BusinessDetails /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "reset-password", element: <ResetPassword /> },
      {
        path: "account",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "account/profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "messages",
        element: (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        ),
      },
      {
        path: "seller",
        element: (
          <ProtectedRoute>
            <SellerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "seller/products",
        element: (
          <ProtectedRoute>
            <SellerProducts />
          </ProtectedRoute>
        ),
      },
      {
        path: "seller/profile",
        element: (
          <ProtectedRoute>
            <SellerProfile />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
