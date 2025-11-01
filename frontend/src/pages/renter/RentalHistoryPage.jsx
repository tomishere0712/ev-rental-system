import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bookingService } from "../../services";
import {
  Calendar,
  Car,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  BarChart3,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";

const RentalHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all"); // all, month, year

  useEffect(() => {
    fetchRentalHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchRentalHistory = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getRentalHistory({ timeRange });
      setHistory(response.data.history || []);
      setAnalytics(response.data.analytics || null);
    } catch (error) {
      toast.error("Không thể tải lịch sử thuê xe");
      console.error(error);
    } finally {
      setLoading(false);
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

  const getMonthName = (month) => {
    const months = [
      "T1",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
      "T7",
      "T8",
      "T9",
      "T10",
      "T11",
      "T12",
    ];
    return months[month - 1] || month;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Lịch sử thuê xe
        </h1>
        <p className="text-gray-600">
          Xem lại các chuyến đã hoàn thành và thống kê chi tiêu
        </p>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            Khoảng thời gian:
          </span>
          <div className="flex gap-2">
            {[
              { value: "all", label: "Tất cả" },
              { value: "month", label: "Tháng này" },
              { value: "year", label: "Năm nay" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === option.value
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
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
      ) : (
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* History List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                    Các chuyến đã hoàn thành
                  </h2>
                </div>

                <div className="p-6">
                  {history.length === 0 ? (
                    <div className="text-center py-12">
                      <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Chưa có lịch sử
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Các chuyến thuê đã hoàn thành sẽ hiển thị ở đây
                      </p>
                      <Link
                        to="/vehicles"
                        className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Thuê xe ngay
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((booking) => (
                        <Link
                          key={booking._id}
                          to={`/renter/bookings/${booking._id}`}
                          className="block border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-4 flex-1">
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
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                  {booking.vehicle?.name || "N/A"}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  {new Date(
                                    booking.pickupTime
                                  ).toLocaleDateString("vi-VN")}
                                  {booking.returnTime &&
                                    ` - ${new Date(
                                      booking.returnTime
                                    ).toLocaleDateString("vi-VN")}`}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                  <span className="flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {booking.pickupStation?.name}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatDuration(booking.duration)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary-600">
                                {booking.totalPrice?.toLocaleString("vi-VN")}đ
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analytics Sidebar */}
            <div className="space-y-6">
              {/* Peak Hours */}
              {analytics?.peakHours && analytics.peakHours.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
                    Giờ thuê nhiều nhất
                  </h3>
                  <div className="space-y-3">
                    {analytics.peakHours.slice(0, 5).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600">
                          {item._id}:00 - {item._id + 1}:00
                        </span>
                        <div className="flex items-center">
                          <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                            <div
                              className="h-2 bg-primary-600 rounded-full"
                              style={{
                                width: `${
                                  (item.count / analytics.peakHours[0].count) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Spending */}
              {analytics?.monthlySpending &&
                analytics.monthlySpending.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-primary-600" />
                      Chi tiêu theo tháng
                    </h3>
                    <div className="space-y-3">
                      {analytics.monthlySpending.slice(-6).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-600">
                            {getMonthName(item._id.month)}/{item._id.year}
                          </span>
                          <div className="flex items-center">
                            <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                              <div
                                className="h-2 bg-green-600 rounded-full"
                                style={{
                                  width: `${
                                    (item.total /
                                      Math.max(
                                        ...analytics.monthlySpending.map(
                                          (m) => m.total
                                        )
                                      )) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                              {(item.total / 1000).toFixed(0)}K
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Favorite Vehicles */}
              {analytics?.favoriteVehicles &&
                analytics.favoriteVehicles.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Car className="w-5 h-5 mr-2 text-primary-600" />
                      Xe thuê nhiều nhất
                    </h3>
                    <div className="space-y-3">
                      {analytics.favoriteVehicles
                        .slice(0, 5)
                        .map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.vehicle?.name || "N/A"}
                              </p>
                              <p className="text-xs text-gray-600">
                                {item.vehicle?.type}
                              </p>
                            </div>
                            <span className="ml-3 px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-semibold">
                              {item.count} lần
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Tips */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg shadow-md p-6 text-white">
                <TrendingUp className="w-8 h-8 mb-3" />
                <h3 className="text-lg font-semibold mb-2">Mẹo tiết kiệm</h3>
                <p className="text-sm text-primary-100">
                  Đặt xe vào giờ thấp điểm (6h-8h sáng) để có giá tốt hơn và
                  nhiều lựa chọn xe hơn.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RentalHistoryPage;
