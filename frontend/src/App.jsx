import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useAuthRefresh } from "./hooks/useAuthRefresh";
import toast from "react-hot-toast";

// Layouts
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Public Pages
import HomePage from "./pages/public/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import StationsPage from "./pages/public/StationsPage";
import VehiclesPage from "./pages/public/VehiclesPage";
import VehicleDetailPage from "./pages/public/VehicleDetailPage";

// Renter Pages
import RenterDashboard from "./pages/renter/RenterDashboard";
import BookVehiclePage from "./pages/renter/BookVehiclePage";
import MyBookingsPage from "./pages/renter/MyBookingsPage";
import BookingDetailPage from "./pages/renter/BookingDetailPage";
import RenterProfilePage from "./pages/renter/RenterProfilePage";

// Staff Pages
import StaffDashboard from "./pages/staff/StaffDashboard";
import VehicleHandoverPage from "./pages/staff/VehicleHandoverPage";
import CustomerVerificationPage from "./pages/staff/CustomerVerificationPage";
import StationVehiclesPage from "./pages/staff/StationVehiclesPage";
import ProcessPaymentPage from "./pages/staff/ProcessPaymentPage";
import StaffProfilePage from "./pages/staff/StaffProfilePage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageVehiclesPage from "./pages/admin/ManageVehiclesPage";
import ManageStationsPage from "./pages/admin/ManageStationsPage";
import ManageUsersPage from "./pages/admin/ManageUsersPage";
import ManageStaffPage from "./pages/admin/ManageStaffPage";
import ReportsPage from "./pages/admin/ReportsPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";

// Payment Pages
import PaymentSandboxPage from "./pages/payment/PaymentSandboxPage";
import PaymentResultPage from "./pages/payment/PaymentResultPage";

function App() {
  const { user } = useAuthStore();
  
  // Auto-refresh user data on app mount/reload
  useAuthRefresh();

  // Protected Route Component
  /* eslint-disable react/prop-types */
  const ProtectedRoute = ({ children, allowedRoles }) => {
    // Nếu allowedRoles chứa null (cho phép người chưa đăng nhập) và người dùng chưa đăng nhập
    if (allowedRoles?.includes(null) && !user) {
      return children;
    }

    // Nếu cần đăng nhập nhưng chưa đăng nhập
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // Nếu đã đăng nhập nhưng không có quyền
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      toast.error("Bạn không có quyền truy cập trang này");
      return <Navigate to="/" replace />;
    }

    return children;
  };
  /* eslint-enable react/prop-types */

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/stations" element={<StationsPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Payment Routes (Public for callback) */}
      <Route path="/payment/sandbox" element={<PaymentSandboxPage />} />
      <Route path="/payment/success" element={<PaymentResultPage />} />
      <Route path="/payment/failed" element={<PaymentResultPage />} />

      {/* Renter Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["renter"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/renter/dashboard" element={<RenterDashboard />} />
        <Route path="/renter/book" element={<BookVehiclePage />} />
        <Route path="/renter/bookings" element={<MyBookingsPage />} />
        <Route path="/renter/bookings/:id" element={<BookingDetailPage />} />
        <Route path="/renter/profile" element={<RenterProfilePage />} />
      </Route>

      {/* Staff Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/handover" element={<VehicleHandoverPage />} />
        <Route path="/staff/verify" element={<CustomerVerificationPage />} />
        <Route path="/staff/vehicles" element={<StationVehiclesPage />} />
        <Route path="/staff/payment" element={<ProcessPaymentPage />} />
        <Route path="/staff/profile" element={<StaffProfilePage />} />
      </Route>

      {/* Admin Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/vehicles" element={<ManageVehiclesPage />} />
        <Route path="/admin/stations" element={<ManageStationsPage />} />
        <Route path="/admin/users" element={<ManageUsersPage />} />
        <Route path="/admin/staff" element={<ManageStaffPage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
