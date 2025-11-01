import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bookingService } from "../../services";
import {
  Calendar,
  Car,
  MapPin,
  Clock,
  DollarSign,
  Filter,
  Search,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "picked-up", label: "Đang thuê" },
    { value: "returned", label: "Đã trả xe" },
    { value: "cancelled", label: "Đã hủy" },
  ];

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await bookingService.getMyBookings(params);
      setBookings(response.data.bookings);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.totalPages,
      }));
    } catch (error) {
      toast.error("Không thể tải danh sách đơn thuê");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        text: "Chờ xác nhận",
        icon: Clock,
      },
      confirmed: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        text: "Đã xác nhận",
        icon: CheckCircle,
      },
      "picked-up": {
        color: "bg-green-100 text-green-800 border-green-200",
        text: "Đang thuê",
        icon: Car,
      },
      returned: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        text: "Đã trả",
        icon: CheckCircle,
      },
      cancelled: {
        color: "bg-red-100 text-red-800 border-red-200",
        text: "Đã hủy",
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center border ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn thuê này?")) return;

    try {
      await bookingService.cancelBooking(bookingId);
      toast.success("Đã hủy đơn thuê");
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể hủy đơn thuê");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Đơn thuê của tôi
        </h1>
        <p className="text-gray-600">
          Quản lý và theo dõi các chuyến thuê xe của bạn
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center text-gray-700 font-medium">
            <Filter className="w-5 h-5 mr-2" />
            Bộ lọc:
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Tìm theo mã đơn, tên xe..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setFilters({ status: "", search: "" });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Chưa có đơn thuê nào
          </h3>
          <p className="text-gray-600 mb-6">
            Bắt đầu khám phá và thuê xe điện ngay hôm nay!
          </p>
          <Link
            to="/vehicles"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Tìm xe ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
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

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {booking.vehicle?.name || "N/A"}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Mã đơn:{" "}
                              <span className="font-mono font-medium">
                                {booking.bookingNumber}
                              </span>
                            </p>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-primary-600 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500">
                                Điểm lấy
                              </div>
                              <div className="font-medium">
                                {booking.pickupStation?.name || "N/A"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500">
                                Điểm trả
                              </div>
                              <div className="font-medium">
                                {booking.returnStation?.name || "N/A"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-2 text-primary-600 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500">
                                Thời gian lấy
                              </div>
                              <div className="font-medium">
                                {new Date(booking.pickupTime).toLocaleString(
                                  "vi-VN",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-600">
                            <DollarSign className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500">
                                Tổng tiền
                              </div>
                              <div className="font-bold text-primary-600">
                                {booking.totalPrice?.toLocaleString("vi-VN")}đ
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Đặt lúc:{" "}
                      {new Date(booking.createdAt).toLocaleString("vi-VN")}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/renter/bookings/${booking._id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        Xem chi tiết →
                      </Link>

                      {booking.status === "pending" && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>

              <span className="px-4 py-2 text-gray-600">
                Trang {pagination.page} / {pagination.totalPages}
              </span>

              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.totalPages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          )}

          <div className="mt-4 text-center text-sm text-gray-600">
            Hiển thị {bookings.length} / {pagination.total} đơn thuê
          </div>
        </>
      )}
    </div>
  );
};

export default MyBookingsPage;
