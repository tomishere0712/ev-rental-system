import { useState, useEffect } from "react";
import { DollarSign, Search, Clock, Check, AlertCircle, Calendar, User, Car } from "lucide-react";
import { staffService } from "../../services";
import RefundConfirmationModal from "../../components/staff/RefundConfirmationModal";
import toast from "react-hot-toast";

const RefundManagementPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);

  useEffect(() => {
    fetchRefundPendingBookings();
  }, []);

  const fetchRefundPendingBookings = async () => {
    try {
      setLoading(true);
      const response = await staffService.getBookings({ 
        status: "refund_pending" 
      });
      
      const bookingsList = response.data || response || [];
      console.log("📋 Loaded refund_pending bookings:", bookingsList.length);
      setBookings(bookingsList);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Không thể tải danh sách booking");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchRefundPendingBookings();
      return;
    }

    try {
      setLoading(true);
      const response = await staffService.getBookings({ 
        search: searchQuery.trim(),
        status: "refund_pending"
      });
      const results = response.data || response || [];
      setBookings(results);
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Lỗi tìm kiếm");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = (booking) => {
    setSelectedBooking(booking);
    setShowRefundModal(true);
  };
  
  const handleConfirmAdditionalPayment = async (bookingId) => {
    try {
      const confirmed = window.confirm(
        "Xác nhận bạn đã nhận tiền thanh toán chi phí phát sinh từ khách hàng?\n\n" +
        "Booking sẽ được chuyển sang trạng thái hoàn tất."
      );
      
      if (!confirmed) return;
      
      // Call API to confirm additional payment received
      await staffService.confirmAdditionalPaymentReceived(bookingId);
      toast.success("Đã xác nhận nhận tiền! Booking hoàn tất.");
      fetchRefundPendingBookings();
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error(error.response?.data?.message || "Không thể xác nhận");
    }
  };

  const handleRefundSuccess = () => {
    setShowRefundModal(false);
    setSelectedBooking(null);
    fetchRefundPendingBookings();
    toast.success("Đã xác nhận hoàn tiền thành công!");
  };

  const getRefundStatusBadge = (status) => {
    const badges = {
      pending: { 
        bg: "bg-yellow-100", 
        text: "text-yellow-800", 
        icon: Clock,
        label: "Chờ hoàn tiền" 
      },
      refunded: { 
        bg: "bg-green-100", 
        text: "text-green-800", 
        icon: Check,
        label: "Đã hoàn tiền" 
      },
      pending_payment: { 
        bg: "bg-orange-100", 
        text: "text-orange-800", 
        icon: AlertCircle,
        label: "Chờ thanh toán bổ sung" 
      },
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý hoàn tiền cọc
            </h1>
          </div>
          <p className="text-gray-600">
            Danh sách booking cần xử lý hoàn tiền cọc cho khách hàng
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo mã booking hoặc tên khách hàng..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Tìm kiếm
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  fetchRefundPendingBookings();
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Xóa lọc
              </button>
            )}
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Chờ hoàn tiền</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {bookings.filter(b => b.depositRefund?.status === "pending").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Đã hoàn tiền</p>
                <p className="text-2xl font-bold text-green-600">
                  {bookings.filter(b => b.depositRefund?.status === "refunded").length}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Chờ thanh toán bổ sung</p>
                <p className="text-2xl font-bold text-orange-600">
                  {bookings.filter(b => b.depositRefund?.status === "pending_payment").length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Không có booking nào cần hoàn tiền
            </h3>
            <p className="text-gray-600">
              Tất cả booking đã được xử lý hoàn tiền cọc
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const refundStatus = getRefundStatusBadge(booking.depositRefund?.status);
              const StatusIcon = refundStatus.icon;
              
              // Check if this is additional payment case (charges > deposit)
              const hasAdditionalPayment = booking.additionalPayment && booking.additionalPayment.amount > 0;
              const additionalPaymentCompleted = hasAdditionalPayment && (booking.additionalPayment.status === "paid" || booking.additionalPayment.status === "completed");
              
              // Determine what action is available
              let canProcessRefund = false;
              let canConfirmPayment = false;
              let actionButton = null;
              
              if (additionalPaymentCompleted) {
                // Case: Customer paid additional charges, staff needs to confirm receipt
                canConfirmPayment = true;
                actionButton = (
                  <button
                    onClick={() => handleConfirmAdditionalPayment(booking._id)}
                    className="ml-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2 whitespace-nowrap"
                  >
                    <Check className="w-5 h-5" />
                    Xác nhận đã nhận tiền
                  </button>
                );
              } else if (booking.depositRefund?.status === "pending" && !hasAdditionalPayment) {
                // Case: Normal refund (charges <= deposit)
                canProcessRefund = true;
                actionButton = (
                  <button
                    onClick={() => handleProcessRefund(booking)}
                    className="ml-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2 whitespace-nowrap"
                  >
                    <DollarSign className="w-5 h-5" />
                    Xử lý hoàn tiền
                  </button>
                );
              }

              return (
                <div
                  key={booking._id}
                  className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${
                    additionalPaymentCompleted ? 'border-2 border-blue-300' : ''
                  }`}
                >
                  <div className="p-6">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {booking.bookingCode}
                          </h3>
                          {additionalPaymentCompleted ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              ✅ Khách đã thanh toán - Chờ xác nhận
                            </span>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${refundStatus.bg} ${refundStatus.text} flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {refundStatus.label}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {/* Customer Info */}
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span className="font-medium">
                              {booking.renter?.fullName || "N/A"}
                            </span>
                          </div>

                          {/* Vehicle Info */}
                          <div className="flex items-center gap-2 text-gray-600">
                            <Car className="w-4 h-4" />
                            <span>
                              {booking.vehicle?.name} ({booking.vehicle?.licensePlate})
                            </span>
                          </div>

                          {/* Rental Period */}
                          <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(booking.startDate).toLocaleDateString("vi-VN")} -{" "}
                              {new Date(booking.endDate).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      {actionButton}
                    </div>

                    {/* Refund Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Tiền cọc ban đầu</p>
                          <p className="text-lg font-bold text-gray-900">
                            {booking.pricing?.deposit?.toLocaleString()}đ
                          </p>
                        </div>

                        {booking.pricing?.additionalCharges?.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Chi phí phát sinh</p>
                            <p className="text-lg font-bold text-red-600">
                              {booking.pricing.additionalCharges.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}đ
                            </p>
                          </div>
                        )}

                        {hasAdditionalPayment ? (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">
                              {additionalPaymentCompleted ? "✅ Khách đã trả thêm" : "⏳ Cần trả thêm"}
                            </p>
                            <p className={`text-lg font-bold ${additionalPaymentCompleted ? 'text-green-600' : 'text-orange-600'}`}>
                              +{booking.additionalPayment.amount?.toLocaleString()}đ
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Số tiền hoàn lại</p>
                            <p className="text-lg font-bold text-green-600">
                              {booking.depositRefund?.amount?.toLocaleString() || "0"}đ
                            </p>
                          </div>
                        )}
                      </div>

                      {additionalPaymentCompleted && (
                        <div className="mt-3 pt-3 border-t border-blue-200 bg-blue-50 -mx-4 -mb-4 p-4 rounded-b-lg">
                          <p className="text-sm text-blue-900 font-semibold mb-2">
                            💳 Thông tin thanh toán của khách:
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-blue-700">Số tiền:</span>
                              <span className="ml-2 font-bold text-blue-900">
                                {booking.additionalPayment.amount?.toLocaleString()}đ
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-700">Phương thức:</span>
                              <span className="ml-2 font-bold text-blue-900">VNPAY</span>
                            </div>
                            {booking.additionalPayment.transactionId && (
                              <div className="col-span-2">
                                <span className="text-blue-700">Mã GD:</span>
                                <span className="ml-2 font-mono font-bold text-blue-900">
                                  {booking.additionalPayment.transactionId}
                                </span>
                              </div>
                            )}
                            {booking.additionalPayment.paidAt && (
                              <div className="col-span-2">
                                <span className="text-blue-700">Thời gian:</span>
                                <span className="ml-2 font-bold text-blue-900">
                                  {new Date(booking.additionalPayment.paidAt).toLocaleString("vi-VN")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {booking.depositRefund?.notes && !hasAdditionalPayment && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">📝 Ghi chú:</p>
                          <p className="text-sm text-gray-700">{booking.depositRefund.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && selectedBooking && (
        <RefundConfirmationModal
          booking={selectedBooking}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedBooking(null);
          }}
          onSuccess={handleRefundSuccess}
        />
      )}
    </div>
  );
};

export default RefundManagementPage;
