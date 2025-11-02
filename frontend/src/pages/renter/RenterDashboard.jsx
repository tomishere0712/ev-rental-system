import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { bookingService } from "../../services";
import VerificationAlert from "../../components/VerificationAlert";
import {
  Car,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  MapPin,
  Battery,
} from "lucide-react";
import toast from "react-hot-toast";

const RenterDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    activeBookings: 0,
    totalBookings: 0,
    totalSpent: 0,
    vehiclesRented: 0,
  });
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch active bookings (confirmed and in-progress)
      const bookingsResponse = await bookingService.getMyBookings({
        status: "confirmed,in-progress",
        limit: 10,
      });
      console.log("Dashboard bookings response:", bookingsResponse);
      
      // Backend returns: { success, data: [...], pagination: {...} }
      const bookings = bookingsResponse.data || [];
      setActiveBookings(bookings);

      // Fetch all bookings for stats
      const allBookingsResponse = await bookingService.getMyBookings({
        limit: 1000,
      });
      const allBookings = allBookingsResponse.data || [];

      // Calculate total spent - only count bookings that have been paid (pending, confirmed, in-progress, completed)
      const paidStatuses = ['pending', 'confirmed', 'in-progress', 'completed'];
      const paidBookings = allBookings.filter(b => paidStatuses.includes(b.status));
      
      const totalSpent = paidBookings.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
      
      // Count unique vehicles - only count paid bookings
      const uniqueVehicles = new Set(
        paidBookings
          .filter(b => b.vehicle?._id)
          .map((b) => b.vehicle._id)
      ).size;

      setStats({
        activeBookings: bookings.length,
        totalBookings: paidBookings.length, // Only count paid bookings
        totalSpent: totalSpent,
        vehiclesRented: uniqueVehicles,
      });
    } catch (error) {
      toast.error("Không thể tải dữ liệu dashboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        text: "Chờ xác nhận",
        icon: Clock,
      },
      confirmed: {
        color: "bg-blue-100 text-blue-800",
        text: "Đã xác nhận",
        icon: CheckCircle,
      },
      "in-progress": {
        color: "bg-green-100 text-green-800",
        text: "Đang thuê",
        icon: Car,
      },
      completed: {
        color: "bg-gray-100 text-gray-800",
        text: "Hoàn thành",
        icon: CheckCircle,
      },
      cancelled: {
        color: "bg-red-100 text-red-800",
        text: "Đã hủy",
        icon: AlertCircle,
      },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Xin chào, {user?.fullName}! 👋
        </h1>
        <p className="text-gray-600">
          Chào mừng trở lại với hệ thống thuê xe điện
        </p>
      </div>

      {/* Verification Alert */}
      <VerificationAlert />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Đang thuê</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? "..." : stats.activeBookings}
          </div>
          <p className="text-sm text-gray-600">Chuyến đang hoạt động</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Tổng số</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? "..." : stats.totalBookings}
          </div>
          <p className="text-sm text-gray-600">Chuyến đã đặt</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Chi tiêu</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? "..." : `${stats.totalSpent.toLocaleString("vi-VN")}đ`}
          </div>
          <p className="text-sm text-gray-600">Tổng chi tiêu</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Đa dạng</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? "..." : stats.vehiclesRented}
          </div>
          <p className="text-sm text-gray-600">Loại xe đã thuê</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Bookings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Chuyến đang hoạt động
                </h2>
                <Link
                  to="/renter/bookings"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Xem tất cả →
                </Link>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : activeBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Chưa có chuyến nào
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Bắt đầu thuê xe ngay hôm nay!
                  </p>
                  <Link
                    to="/vehicles"
                    className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Tìm xe
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBookings.map((booking) => (
                    <Link
                      key={booking._id}
                      to={`/renter/bookings/${booking._id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            {booking.vehicle?.images?.[0] ? (
                              <img
                                src={booking.vehicle.images[0]}
                                alt={booking.vehicle.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Car className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {booking.vehicle?.name || "N/A"}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {booking.bookingNumber}
                            </p>
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary-600">
                            {booking.pricing?.totalAmount?.toLocaleString("vi-VN")}đ
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>
                            {new Date(booking.startDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="truncate">
                            {booking.pickupStation?.name || "N/A"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Thao tác nhanh
            </h2>
            <div className="space-y-3">
              <Link
                to="/vehicles"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center">
                  <Car className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="font-medium text-gray-900">Tìm xe</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>

              <Link
                to="/stations"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="font-medium text-gray-900">
                    Tìm điểm thuê
                  </span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>

              <Link
                to="/renter/bookings"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="font-medium text-gray-900">
                    Booking của tôi
                  </span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>

              <Link
                to="/renter/history"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="font-medium text-gray-900">
                    Lịch sử thuê
                  </span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg shadow-md p-6 text-white">
            <Battery className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Mẹo tiết kiệm pin</h3>
            <p className="text-sm text-primary-100">
              Tránh tăng tốc đột ngột và phanh gấp để tối ưu hóa quãng đường di
              chuyển với một lần sạc pin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenterDashboard;
