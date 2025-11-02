import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  LayoutDashboard,
  Car,
  MapPin,
  Users,
  FileText,
  Calendar,
  User,
  History,
  CheckCircle,
  CreditCard,
  UserCheck,
} from "lucide-react";

const Sidebar = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  const renterLinks = [
    { to: "/renter/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
    { to: "/renter/book", icon: Calendar, label: "Đặt xe" },
    { to: "/renter/bookings", icon: FileText, label: "Quản lý chuyến thuê" },
    { to: "/renter/profile", icon: User, label: "Hồ sơ" },
  ];

  const staffLinks = [
    { to: "/staff/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
    { to: "/staff/handover", icon: CheckCircle, label: "Giao/Nhận xe" },
    { to: "/staff/verify", icon: UserCheck, label: "Xác thực khách hàng" },
    { to: "/staff/vehicles", icon: Car, label: "Xe tại điểm" },
    { to: "/staff/payment", icon: CreditCard, label: "Thanh toán" },
    { to: "/staff/profile", icon: User, label: "Hồ sơ" },
  ];

  const adminLinks = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
    { to: "/admin/vehicles", icon: Car, label: "Quản lý xe" },
    { to: "/admin/stations", icon: MapPin, label: "Quản lý điểm thuê" },
    { to: "/admin/users", icon: Users, label: "Quản lý khách hàng" },
    { to: "/admin/staff", icon: UserCheck, label: "Quản lý nhân viên" },
    { to: "/admin/reports", icon: FileText, label: "Báo cáo" },
    { to: "/admin/profile", icon: User, label: "Hồ sơ" },
  ];

  const getLinks = () => {
    switch (user?.role) {
      case "renter":
        return renterLinks;
      case "staff":
        return staffLinks;
      case "admin":
        return adminLinks;
      default:
        return [];
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <nav className="space-y-1">
        {getLinks().map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
