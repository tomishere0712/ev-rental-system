import { createBrowserRouter } from "react-router-dom";
import PrivateRoute from "../components/auth/PrivateRoute";
import RenterRoute from "../components/auth/RenterRoute";
import StaffRoute from "../components/auth/StaffRoute";
import AdminRoute from "../components/auth/AdminRoute";
import MainLayout from "../layouts/MainLayout";
import DashboardLayout from "../layouts/DashboardLayout";

// Public Pages
import HomePage from "../pages/public/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import StationsPage from "../pages/public/StationsPage";
import VehiclesPage from "../pages/public/VehiclesPage";
import VehicleDetailPage from "../pages/public/VehicleDetailPage";

// Renter Pages
import RenterDashboard from "../pages/renter/RenterDashboard";
import RenterProfilePage from "../pages/renter/RenterProfilePage";
import BookVehiclePage from "../pages/renter/BookVehiclePage";
import MyBookingsPage from "../pages/renter/MyBookingsPage";
import BookingDetailPage from "../pages/renter/BookingDetailPage";
import RentalHistoryPage from "../pages/renter/RentalHistoryPage";

// Staff Pages
import StaffDashboard from "../pages/staff/StaffDashboard";
import CustomerVerificationPage from "../pages/staff/CustomerVerificationPage";
import ProcessPaymentPage from "../pages/staff/ProcessPaymentPage";
import StationVehiclesPage from "../pages/staff/StationVehiclesPage";
import VehicleHandoverPage from "../pages/staff/VehicleHandoverPage";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageStationsPage from "../pages/admin/ManageStationsPage";
import ManageVehiclesPage from "../pages/admin/ManageVehiclesPage";
import ManageStaffPage from "../pages/admin/ManageStaffPage";
import ManageUsersPage from "../pages/admin/ManageUsersPage";
import ReportsPage from "../pages/admin/ReportsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "stations",
        element: <StationsPage />,
      },
      {
        path: "vehicles",
        element: <VehiclesPage />,
      },
      {
        path: "vehicles/:id",
        element: (
          <RenterRoute>
            <VehicleDetailPage />
          </RenterRoute>
        ),
      },
      {
        path: "vehicles/:id/book",
        element: (
          <PrivateRoute>
            <RenterRoute>
              <BookVehiclePage />
            </RenterRoute>
          </PrivateRoute>
        ),
      },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <DashboardLayout />
      </PrivateRoute>
    ),
    children: [
      // Renter routes
      {
        path: "renter",
        element: (
          <RenterRoute>
            <RenterDashboard />
          </RenterRoute>
        ),
      },
      {
        path: "renter/profile",
        element: (
          <RenterRoute>
            <RenterProfilePage />
          </RenterRoute>
        ),
      },
      {
        path: "renter/bookings",
        element: (
          <RenterRoute>
            <MyBookingsPage />
          </RenterRoute>
        ),
      },
      {
        path: "renter/bookings/:id",
        element: (
          <RenterRoute>
            <BookingDetailPage />
          </RenterRoute>
        ),
      },
      {
        path: "renter/history",
        element: (
          <RenterRoute>
            <RentalHistoryPage />
          </RenterRoute>
        ),
      },

      // Staff routes
      {
        path: "staff",
        element: (
          <StaffRoute>
            <StaffDashboard />
          </StaffRoute>
        ),
      },
      {
        path: "staff/verify",
        element: (
          <StaffRoute>
            <CustomerVerificationPage />
          </StaffRoute>
        ),
      },
      {
        path: "staff/payments",
        element: (
          <StaffRoute>
            <ProcessPaymentPage />
          </StaffRoute>
        ),
      },
      {
        path: "staff/vehicles",
        element: (
          <StaffRoute>
            <StationVehiclesPage />
          </StaffRoute>
        ),
      },
      {
        path: "staff/handover",
        element: (
          <StaffRoute>
            <VehicleHandoverPage />
          </StaffRoute>
        ),
      },

      // Admin routes
      {
        path: "admin",
        element: (
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        ),
      },
      {
        path: "admin/stations",
        element: (
          <AdminRoute>
            <ManageStationsPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/vehicles",
        element: (
          <AdminRoute>
            <ManageVehiclesPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/staff",
        element: (
          <AdminRoute>
            <ManageStaffPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <AdminRoute>
            <ManageUsersPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/reports",
        element: (
          <AdminRoute>
            <ReportsPage />
          </AdminRoute>
        ),
      },
    ],
  },
]);