import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { LogOut, User, Menu } from "lucide-react";
import { useState } from "react";

const DashboardNavbar = () => {
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-white/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Sát bên trái */}
          <Link to="/" className="flex items-center gap-3 group">
            {/* Logo image */}
            <div className="relative">
              <div className="h-12 w-auto bg-white rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105 overflow-hidden border-2 border-green-100 px-2">
                <img 
                  src="https://www.shutterstock.com/image-vector/electric-car-e-plug-green-600nw-2303576823.jpg" 
                  alt="EV Rental Logo"
                  className="h-full w-auto object-contain"
                />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-green-400 rounded-xl blur-md opacity-20 group-hover:opacity-30 transition-opacity"></div>
            </div>
            {/* Text */}
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                EV Rental
              </span>
              <span className="text-[10px] text-gray-500 font-medium -mt-1">
                Xe điện xanh
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Links dành cho renter - Bỏ Dashboard */}
            {user?.role === "renter" && (
              <>
                <Link
                  to="/vehicles"
                  className="text-gray-600 hover:text-primary-600 transition"
                >
                  Xe điện
                </Link>
                <Link
                  to="/renter/bookings"
                  className="text-gray-600 hover:text-primary-600 transition"
                >
                  Đơn thuê
                </Link>
              </>
            )}

            {/* Notification Bell */}
           

            {/* User Menu */}
            {user && (
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

export default DashboardNavbar;
