import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Menu, User, LogOut } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    switch (user.role) {
      case "renter":
        return "/renter/dashboard";
      case "staff":
        return "/staff/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <span className="text-xl font-bold text-gray-900">EV Rental</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/stations"
              className="text-gray-600 hover:text-primary-600 transition"
            >
              Điểm thuê
            </Link>
            <Link
              to="/vehicles"
              className="text-gray-600 hover:text-primary-600 transition"
            >
              Xe điện
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition"
                >
                  <User className="w-5 h-5" />
                  <span>{user.fullName}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                    <Link
                      to={getDashboardLink()}
                      className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Dashboard
                    </Link>
                    {user.role === "renter" && (
                      <>
                        <Link
                          to="/renter/profile"
                          className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Hồ sơ
                        </Link>
                        <Link
                          to="/renter/bookings"
                          className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Đơn thuê
                        </Link>
                      </>
                    )}
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary-600 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
