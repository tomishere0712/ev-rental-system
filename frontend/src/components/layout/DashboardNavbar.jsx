import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Bell, LogOut } from "lucide-react";

const DashboardNavbar = () => {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <span className="text-xl font-bold text-gray-900">EV Rental</span>
          </Link>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-semibold">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
