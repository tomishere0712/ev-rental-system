import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bookingService, paymentService } from "../../services";
import VerificationAlert from "../../components/VerificationAlert";
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
  History,
  ListChecks,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

const MyBookingsPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [bookings, setBookings] = useState([]);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
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

  const tabs = [
    {
      id: "active",
      label: "Đơn thuê hiện tại",
      icon: ListChecks,
    },
    {
      id: "history",
      label: "Lịch sử thuê xe",
      icon: History,
    },
  ];

  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "in-progress", label: "Đang thuê" },
    { value: "cancelled", label: "Đã hủy" },
  ];

  useEffect(() => {
    if (activeTab === "active") {
      fetchBookings();
    } else {
      fetchRentalHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pagination.page, filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await bookingService.getMyBookings(params);
      console.log("Bookings API response:", response);
      
      // Backend returns: { success, data: [...], pagination: {...} }
      const bookingsData = response.data || [];
      
      // Hiện tất cả trạng thái (bao gồm cả cancelled, reserved)
      const filteredBookings = Array.isArray(bookingsData) 
        ? bookingsData
        : [];
      
      setBookings(filteredBookings);
      
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 0,
      }));
    } catch (error) {
      toast.error("Không thể tải danh sách đơn thuê");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRentalHistory = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getRentalHistory({ timeRange: "all" });
      setHistory(response.data.history || []);
      setAnalytics(response.data.analytics || null);
    } catch (error) {
      toast.error("Không thể tải lịch sử thuê xe");
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
      reserved: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        text: "Giữ chỗ",
        icon: Clock,
      },
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
      "in-progress": {
        color: "bg-green-100 text-green-800 border-green-200",
        text: "Đang thuê",
        icon: Car,
      },
      completed: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        text: "Hoàn thành",
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
    const reason = window.prompt(
      "Vui lòng nhập lý do hủy đơn:",
      "Thay đổi kế hoạch"
    );
    
    if (!reason) return; // User clicked cancel

    try {
      await bookingService.cancel(bookingId, reason);
      toast.success("Đã hủy đơn thuê thành công");
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể hủy đơn thuê");
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quản lý chuyến thuê
        </h1>
        <p className="text-gray-600">
          Theo dõi đơn thuê hiện tại và lịch sử thuê xe của bạn
        </p>
      </div>

      {/* Verification Alert */}
      <VerificationAlert />

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                    setFilters({ status: "", search: "" });
                  }}
                  className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Active Bookings Tab */}
      {activeTab === "active" && (
        <>
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
            </div>
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có đơn thuê nào
              </h3>
              <p className="text-gray-600 mb-6">
                Hãy bắt đầu thuê xe điện để trải nghiệm nhé!
              </p>
              <Link
                to="/renter/vehicles"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Khám phá xe điện
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">
                            #{booking.bookingNumber}
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {booking.vehicle?.name || "N/A"}
                          </h3>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      {/* Hiện thời gian còn lại nếu status = "reserved" */}
                      {booking.status === "reserved" && booking.reservedUntil && (
                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2 text-orange-800">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Vui lòng thanh toán trước: {new Date(booking.reservedUntil).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <div className="text-xs text-orange-600 mt-1">
                            Đơn sẽ tự động hủy nếu không thanh toán trong thời gian trên
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm text-gray-500">Thời gian thuê</div>
                            <div className="text-gray-900 font-medium">
                              {new Date(booking.startDate).toLocaleString("vi-VN")}
                            </div>
                            <div className="text-gray-900 font-medium">
                              → {new Date(booking.endDate).toLocaleString("vi-VN")}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm text-gray-500">Điểm đón/trả</div>
                            <div className="text-gray-900">
                              {booking.pickupStation?.name || "N/A"}
                            </div>
                            <div className="text-gray-900">
                              → {booking.returnStation?.name || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <span className="text-2xl font-bold text-gray-900">
                            {booking.pricing?.totalAmount?.toLocaleString("vi-VN")}đ
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <Link
                            to={`/renter/bookings/${booking._id}`}
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                          >
                            Xem chi tiết →
                          </Link>

                          {/* Nút thanh toán cho booking "reserved" */}
                          {booking.status === "reserved" && (
                            <button
                              onClick={async () => {
                                try {
                                  toast.loading("Đang tạo link thanh toán...");
                                  
                                  // Tạo payment link VNPay
                                  const response = await paymentService.createVNPayUrl(booking._id);
                                  
                                  toast.dismiss();
                                  
                                  if (response.data?.paymentUrl) {
                                    window.location.href = response.data.paymentUrl;
                                  } else {
                                    toast.error("Không nhận được link thanh toán");
                                  }
                                } catch (error) {
                                  toast.dismiss();
                                  console.error("Payment error:", error);
                                  toast.error(error.response?.data?.message || "Không thể tạo thanh toán. Vui lòng thử lại!");
                                }
                              }}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                              Thanh toán ngay
                            </button>
                          )}

                          {(booking.status === "pending" || booking.status === "confirmed") && (
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
                <div className="flex justify-center items-center gap-2 mt-6">
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
        </>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <>
          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {analytics.totalTrips || 0}
                </div>
                <p className="text-sm text-gray-600">Tổng số chuyến</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {((analytics.totalSpent || 0) / 1000000).toFixed(1)}M
                </div>
                <p className="text-sm text-gray-600">Tổng chi tiêu (VNĐ)</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatDuration(analytics.totalDuration)}
                </div>
                <p className="text-sm text-gray-600">Tổng thời gian</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {(
                    (analytics.totalSpent || 0) / (analytics.totalTrips || 1)
                  ).toLocaleString("vi-VN", { maximumFractionDigits: 0 })}
                  đ
                </div>
                <p className="text-sm text-gray-600">Chi tiêu trung bình</p>
              </div>
            </div>
          )}

          {/* History List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có lịch sử
              </h3>
              <p className="text-gray-600 mb-6">
                Bạn chưa hoàn thành chuyến thuê nào
              </p>
              <Link
                to="/renter/vehicles"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Khám phá xe điện
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((booking) => (
                <div key={booking._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          #{booking.bookingNumber}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {booking.vehicle?.name || "N/A"}
                        </h3>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Thời gian</div>
                          <div className="text-gray-900">
                            {new Date(booking.startDate).toLocaleDateString("vi-VN")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Tổng tiền</div>
                          <div className="text-gray-900 font-bold">
                            {booking.pricing?.totalAmount?.toLocaleString("vi-VN")}đ
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/renter/bookings/${booking._id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      Xem chi tiết →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyBookingsPage;
