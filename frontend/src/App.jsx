import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

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
import RentalHistoryPage from "./pages/renter/RentalHistoryPage";

// Staff Pages
import StaffDashboard from "./pages/staff/StaffDashboard";
import VehicleHandoverPage from "./pages/staff/VehicleHandoverPage";
import CustomerVerificationPage from "./pages/staff/CustomerVerificationPage";
import StationVehiclesPage from "./pages/staff/StationVehiclesPage";
import ProcessPaymentPage from "./pages/staff/ProcessPaymentPage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageVehiclesPage from "./pages/admin/ManageVehiclesPage";
import ManageStationsPage from "./pages/admin/ManageStationsPage";
import ManageUsersPage from "./pages/admin/ManageUsersPage";
import ManageStaffPage from "./pages/admin/ManageStaffPage";
import ReportsPage from "./pages/admin/ReportsPage";

function App() {
  const { user } = useAuthStore();

  // Protected Route Component
  // eslint-disable-next-line react/prop-types
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }

    return children;
  };

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
        <Route path="/renter/history" element={<RentalHistoryPage />} />
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
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
