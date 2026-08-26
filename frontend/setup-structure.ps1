# Run this from inside your frontend/ folder: .\setup-structure.ps1

Set-Location src -ErrorAction Stop

$folders = @(
  "api","auth","routes","utils","hooks",
  "components/layout","components/listings","components/media","components/common",
  "pages/public","pages/account","pages/seller","pages/admin"
)
foreach ($f in $folders) { New-Item -ItemType Directory -Path $f -Force | Out-Null }

$files = @(
  "api/axiosClient.js","api/auth.js","api/users.js","api/listings.js","api/categories.js",
  "api/subscriptions.js","api/sellerSubscriptions.js","api/payments.js","api/media.js",
  "api/inquiries.js","api/notifications.js","api/reports.js",

  "auth/AuthContext.jsx","auth/ProtectedRoute.jsx","auth/AdminRoute.jsx",

  "routes/AppRoutes.jsx",

  "utils/constants.js","utils/formatters.js",

  "hooks/useAuth.js","hooks/useListings.js","hooks/useNotifications.js",

  "components/layout/Navbar.jsx","components/layout/Footer.jsx","components/layout/AdminSidebar.jsx",
  "components/listings/ListingCard.jsx","components/listings/ListingFilterBar.jsx","components/listings/StatusBadge.jsx",
  "components/media/MediaUploader.jsx","components/media/MediaGrid.jsx",
  "components/common/Button.jsx","components/common/Input.jsx","components/common/Modal.jsx","components/common/LoadingSpinner.jsx",

  "pages/public/Home.jsx","pages/public/Browse.jsx","pages/public/ListingDetail.jsx",
  "pages/public/Login.jsx","pages/public/Register.jsx","pages/public/ResetPassword.jsx",

  "pages/account/Dashboard.jsx","pages/account/Favorites.jsx","pages/account/Inquiries.jsx",
  "pages/account/Notifications.jsx","pages/account/Profile.jsx",

  "pages/seller/BecomeSeller.jsx","pages/seller/SubscriptionPlans.jsx","pages/seller/PaymentInstructions.jsx",
  "pages/seller/ReceiptUpload.jsx","pages/seller/SubscriptionStatus.jsx","pages/seller/MyListings.jsx",
  "pages/seller/ListingForm.jsx","pages/seller/MediaUpload.jsx",

  "pages/admin/AdminDashboard.jsx","pages/admin/ReceiptReview.jsx","pages/admin/MediaModeration.jsx",
  "pages/admin/UserManagement.jsx","pages/admin/ListingManagement.jsx","pages/admin/ReportsManagement.jsx",
  "pages/admin/CategoryManagement.jsx","pages/admin/PlanManagement.jsx"
)
foreach ($f in $files) { New-Item -ItemType File -Path $f -Force | Out-Null }

Write-Host "Done. Structure created inside src/"
