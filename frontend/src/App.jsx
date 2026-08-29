import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import SubscriptionPlans from "./pages/seller/SubscriptionPlans";
import PaymentInstructions from "./pages/seller/PaymentInstructions";
import ReceiptUpload from "./pages/seller/ReceiptUpload";
import SubscriptionStatus from "./pages/seller/SubscriptionStatus";
import MediaUpload from "./pages/seller/MediaUpload";
import Favorites from "./pages/account/Favorites";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/sell/plans" element={<SubscriptionPlans />} />

        <Route
          path="/sell/payment-instructions"
          element={<PaymentInstructions />}
        />

        <Route path="/sell/receipt" element={<ReceiptUpload />} />

        <Route
          path="/sell/subscription-status"
          element={<SubscriptionStatus />}
        />

        <Route
          path="/sell/listings/:id/media"
          element={<MediaUpload />}
        />

        <Route path="/favorites" element={<Favorites />} />
      </Routes>
    </QueryClientProvider>
  );
}