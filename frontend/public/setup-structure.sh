#!/bin/bash
# Run this from inside your frontend/ folder: bash setup-structure.sh

cd src || { echo "Run this from inside the frontend/ folder"; exit 1; }

# Folders
mkdir -p api auth routes utils hooks
mkdir -p components/layout components/listings components/media components/common
mkdir -p pages/public pages/account pages/seller pages/admin

# api/
touch api/axiosClient.js api/auth.js api/users.js api/listings.js api/categories.js \
      api/subscriptions.js api/sellerSubscriptions.js api/payments.js api/media.js \
      api/inquiries.js api/notifications.js api/reports.js

# auth/
touch auth/AuthContext.jsx auth/ProtectedRoute.jsx auth/AdminRoute.jsx

# routes/
touch routes/AppRoutes.jsx

# utils/
touch utils/constants.js utils/formatters.js

# hooks/
touch hooks/useAuth.js hooks/useListings.js hooks/useNotifications.js

# components/
touch components/layout/Navbar.jsx components/layout/Footer.jsx components/layout/AdminSidebar.jsx
touch components/listings/ListingCard.jsx components/listings/ListingFilterBar.jsx components/listings/StatusBadge.jsx
touch components/media/MediaUploader.jsx components/media/MediaGrid.jsx
touch components/common/Button.jsx components/common/Input.jsx components/common/Modal.jsx components/common/LoadingSpinner.jsx

# pages/public
touch pages/public/Home.jsx pages/public/Browse.jsx pages/public/ListingDetail.jsx \
      pages/public/Login.jsx pages/public/Register.jsx pages/public/ResetPassword.jsx

# pages/account
touch pages/account/Dashboard.jsx pages/account/Favorites.jsx pages/account/Inquiries.jsx \
      pages/account/Notifications.jsx pages/account/Profile.jsx

# pages/seller
touch pages/seller/BecomeSeller.jsx pages/seller/SubscriptionPlans.jsx pages/seller/PaymentInstructions.jsx \
      pages/seller/ReceiptUpload.jsx pages/seller/SubscriptionStatus.jsx pages/seller/MyListings.jsx \
      pages/seller/ListingForm.jsx pages/seller/MediaUpload.jsx

# pages/admin
touch pages/admin/AdminDashboard.jsx pages/admin/ReceiptReview.jsx pages/admin/MediaModeration.jsx \
      pages/admin/UserManagement.jsx pages/admin/ListingManagement.jsx pages/admin/ReportsManagement.jsx \
      pages/admin/CategoryManagement.jsx pages/admin/PlanManagement.jsx

echo "Done. Structure created inside src/"
