import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Car,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Package,
} from "lucide-react";
import { staffService } from "../../services";
import toast from "react-hot-toast";

const StaffDashboard = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, bookingsResponse] = await Promise.all([
        staffService.getStats(),
        staffService.getBookings({ status: "pending,confirmed,picked-up" }),
      ]);

      setStats(statsResponse.data);
      setBookings(bookingsResponse.data || []);
    } catch (error) {
      toast.error("Không thể tải dữ liệu dashboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: {
        label: "Chờ xác thực",
        color: "bg-yellow-100 text-yellow-800",
      },
      confirmed: { label: "Đã xác thực", color: "bg-blue-100 text-blue-800" },
      "picked-up": { label: "Đang thuê", color: "bg-green-100 text-green-800" },
    };
    const { label, color } = config[status] || config.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Nhân viên
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý booking và xe tại điểm thuê
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Chờ xác thực"
          value={stats?.pendingBookings || 0}
          icon={AlertCircle}
          color="yellow"
          link="/staff/verify"
        />
        <StatCard
          title="Đang thuê"
          value={stats?.activeRentals || 0}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Lịch hôm nay"
          value={`${stats?.todayPickups || 0} / ${stats?.todayReturns || 0}`}
          icon={Calendar}
          color="blue"
          subtitle="Giao / Nhận"
        />
        <StatCard
          title="Xe khả dụng"
          value={`${stats?.availableVehicles || 0} / ${
            stats?.stationVehicles || 0
          }`}
          icon={Car}
          color="purple"
          subtitle="Tổng số xe"
          link="/staff/vehicles"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Hành động nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/staff/verify"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <CheckCircle className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <p className="font-semibold text-gray-900">Xác thực khách hàng</p>
              <p className="text-sm text-gray-600">Kiểm tra giấy tờ</p>
            </div>
          </Link>

          <Link
            to="/staff/handover"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <Package className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <p className="font-semibold text-gray-900">Giao/Nhận xe</p>
              <p className="text-sm text-gray-600">Bàn giao xe cho khách</p>
            </div>
          </Link>

          <Link
            to="/staff/payment"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <Users className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <p className="font-semibold text-gray-900">Xử lý thanh toán</p>
              <p className="text-sm text-gray-600">Thu tiền thuê xe</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Booking gần đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mã booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Xe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Chưa có booking nào</p>
                  </td>
                </tr>
              ) : (
                bookings.slice(0, 10).map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{booking.bookingNumber || booking._id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.userId?.fullName || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.userId?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {booking.vehicleId?.images?.[0] && (
                          <img
                            src={booking.vehicleId.images[0]}
                            alt=""
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        )}
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {booking.vehicleId?.name || "N/A"}
                          </div>
                          <div className="text-gray-500">
                            {booking.vehicleId?.licensePlate}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(booking.startDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {booking.status === "pending" && (
                        <Link
                          to={`/staff/verify?booking=${booking._id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Xác thực
                        </Link>
                      )}
                      {booking.status === "confirmed" && (
                        <Link
                          to={`/staff/handover?booking=${booking._id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Giao xe
                        </Link>
                      )}
                      {booking.status === "picked-up" && (
                        <Link
                          to={`/staff/payment?booking=${booking._id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Thanh toán
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// StatCard Component
// eslint-disable-next-line react/prop-types
const StatCard = ({ title, value, icon: Icon, color, subtitle, link }) => {
  const colorClasses = {
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
  };

  const content = (
    <>
      <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="ml-4 flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="flex items-baseline">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </>
  );

  if (link) {
    return (
      <Link
        to={link}
        className="bg-white rounded-lg shadow-md p-6 flex items-center hover:shadow-lg transition-shadow"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
      {content}
    </div>
  );
};

export default StaffDashboard;
