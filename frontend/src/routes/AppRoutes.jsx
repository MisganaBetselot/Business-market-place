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
import NotFound from "../pages/public/NotFound";

// Owner: muni
import Favorites from "../pages/account/Favorites";
import SubscriptionPlans from "../pages/seller/SubscriptionPlans";
import PaymentInstructions from "../pages/seller/PaymentInstructions";
import ReceiptUpload from "../pages/seller/ReceiptUpload";
import SubscriptionStatus from "../pages/seller/SubscriptionStatus";
import MediaUpload from "../pages/seller/MediaUpload";

const router = createBrowserRouter([
  {
    path: "/",
    element: <SiteLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: "search", element: <Search /> },
      { path: "business/:id", element: <BusinessDetails /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "reset-password", element: <ResetPassword /> },

      // Everything below requires auth. ProtectedRoute is the route
      // element itself (renders <Outlet /> once authenticated) - actual
      // pages go in ITS children array, not as a React children prop.
      {
        element: <ProtectedRoute />,
        children: [
          { path: "account", element: <Dashboard /> },
          { path: "account/profile", element: <Profile /> },
          { path: "favorites", element: <Favorites /> },
          { path: "messages", element: <Messages /> },
          { path: "seller", element: <SellerDashboard /> },
          { path: "seller/products", element: <SellerProducts /> },
          { path: "seller/profile", element: <SellerProfile /> },
          { path: "sell/plans", element: <SubscriptionPlans /> },
          { path: "sell/payment-instructions", element: <PaymentInstructions /> },
          { path: "sell/receipt", element: <ReceiptUpload /> },
          { path: "sell/subscription-status", element: <SubscriptionStatus /> },
          { path: "sell/listings/:id/media", element: <MediaUpload /> },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;
