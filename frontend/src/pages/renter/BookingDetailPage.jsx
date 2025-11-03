import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { bookingService, paymentService } from "../../services";
import {
  Calendar,
  Car,
  MapPin,
  Clock,
  DollarSign,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Phone,
  Mail,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchBookingDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getById(id);
      console.log("📦 Booking detail response:", response);
      const bookingData = response.data || response;
      console.log("📋 Booking data:", bookingData);
      console.log("💰 Pricing:", bookingData.pricing);
      console.log("💵 Additional charges:", bookingData.pricing?.additionalCharges);
      console.log("💳 Additional payment:", bookingData.additionalPayment);
      console.log("🔄 Deposit refund:", bookingData.depositRefund);
      setBooking(bookingData);
    } catch (error) {
      toast.error("Không thể tải thông tin đơn thuê");
      console.error(error);
    } finally {
      setLoading(false);
    }
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
      pending_return: {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        text: "Chờ trả xe",
        icon: Clock,
      },
      returning: {
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        text: "Đang trả xe",
        icon: Car,
      },
      refund_pending: {
        color: "bg-pink-100 text-pink-800 border-pink-200",
        text: "Chờ xác nhận hoàn tiền",
        icon: Clock,
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
        className={`px-4 py-2 rounded-full text-sm font-semibold inline-flex items-center border ${config.color}`}
      >
        <Icon className="w-4 h-4 mr-2" />
        {config.text}
      </span>
    );
  };

  const handleCancelBooking = async () => {
    const reason = window.prompt(
      "Vui lòng nhập lý do hủy đơn:",
      "Thay đổi kế hoạch"
    );

    if (!reason) return;

    try {
      await bookingService.cancel(id, reason);
      toast.success("Đã hủy đơn thuê thành công");
      fetchBookingDetail();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể hủy đơn thuê");
    }
  };

  const handleConfirmRefund = async () => {
    if (!window.confirm("Xác nhận bạn đã nhận tiền hoàn cọc?")) {
      return;
    }

    try {
      const response = await bookingService.confirmRefundReceived(id);
      toast.success(response.message);
      fetchBookingDetail();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Không thể xác nhận hoàn tiền"
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Không tìm thấy đơn thuê
          </h3>
          <Link
            to="/renter/bookings"
            className="text-primary-600 hover:text-primary-700"
          >
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/renter/bookings")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Chi tiết đơn thuê
            </h1>
            <p className="text-gray-600">#{booking.bookingNumber}</p>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </div>

      {/* Refund Pending Banner - Waiting for staff to transfer money */}
      {booking.status === "refund_pending" && 
       booking.depositRefund && 
       booking.depositRefund.status === "pending" &&
       booking.depositRefund.amount > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-yellow-500 p-3 rounded-full animate-pulse">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-yellow-900 mb-2">
                ⏳ Chờ staff hoàn tiền cọc
              </h3>
              <p className="text-yellow-800 mb-3">
                Staff đang xử lý hoàn tiền{" "}
                <span className="font-bold text-lg text-green-600">
                  {booking.depositRefund.amount.toLocaleString()}đ
                </span>{" "}
                về tài khoản của bạn
              </p>
              {booking.depositRefund.notes && (
                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">📝 Ghi chú:</span> {booking.depositRefund.notes}
                  </p>
                </div>
              )}
              <p className="text-sm text-yellow-700">
                💡 Bạn sẽ nhận được thông báo khi staff chuyển tiền xong. Sau đó bạn cần xác nhận đã nhận tiền để hoàn tất đơn.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Banner - Staff has transferred, waiting for renter confirmation */}
      {booking.status === "refund_pending" && 
       booking.depositRefund && 
       booking.depositRefund.status === "refunded" &&
       booking.depositRefund.amount > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                Xác nhận hoàn tiền cọc
              </h3>
              <p className="text-blue-800 mb-3">
                Staff đã chuyển khoản{" "}
                <span className="font-bold text-lg text-green-600">
                  {booking.depositRefund.amount.toLocaleString()}đ
                </span>{" "}
                vào tài khoản của bạn
              </p>
              <div className="bg-white rounded-lg p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã giao dịch:</span>
                  <span className="font-semibold text-gray-900">
                    {booking.depositRefund.transferReference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(booking.depositRefund.refundedAt).toLocaleString(
                      "vi-VN"
                    )}
                  </span>
                </div>
                {booking.depositRefund.transferNotes && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ghi chú:</span>
                    <span className="font-semibold text-gray-900">
                      {booking.depositRefund.transferNotes}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleConfirmRefund}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Xác nhận đã nhận tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Additional Payment Required Banner */}
      {(booking.status === "pending_return" || booking.status === "refund_pending") && 
       booking.additionalPayment && 
       booking.additionalPayment.status === "pending" &&
       booking.additionalPayment.amount && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-orange-600 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-orange-900 mb-2">
                💳 Cần thanh toán chi phí phát sinh
              </h3>
              <p className="text-orange-800 mb-3">
                Chi phí phát sinh vượt tiền cọc. Bạn cần thanh toán thêm{" "}
                <span className="font-bold text-2xl text-red-600">
                  {booking.additionalPayment.amount.toLocaleString()}đ
                </span>
              </p>
              <div className="bg-white rounded-lg p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tiền cần thanh toán:</span>
                  <span className="font-bold text-lg text-red-600">
                    {booking.additionalPayment.amount.toLocaleString()}đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức:</span>
                  <span className="font-semibold text-gray-900">
                    Thanh toán online qua VNPAY
                  </span>
                </div>
                <div className="bg-blue-50 p-3 rounded mt-2">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Lưu ý:</strong> Vui lòng thanh toán chi phí phát sinh để hoàn tất việc trả xe. 
                    Sau khi thanh toán thành công, đơn thuê sẽ được chuyển sang chờ hoàn cọc.
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await bookingService.createAdditionalPaymentUrl(booking._id);
                    if (response.data?.paymentUrl) {
                      window.location.href = response.data.paymentUrl;
                    }
                  } catch (error) {
                    toast.error(error.response?.data?.message || "Không thể tạo link thanh toán");
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Thanh toán qua VNPAY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Vehicle Info */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center gap-4">
              <Car className="w-12 h-12" />
              <div>
                <h2 className="text-2xl font-bold">
                  {booking.vehicle?.name || "N/A"}
                </h2>
                <p className="text-blue-100">
                  {booking.vehicle?.brand} {booking.vehicle?.model} •{" "}
                  {booking.vehicle?.licensePlate}
                </p>
              </div>
            </div>
          </div>

          {booking.vehicle?.images && booking.vehicle.images.length > 0 && (
            <div className="p-4 relative">
              {/* Main Image */}
              <div className="relative group">
                <img
                  src={booking.vehicle.images[currentImageIndex]}
                  alt={`${booking.vehicle.name} ${currentImageIndex + 1}`}
                  className="w-full h-[700px] object-cover rounded-lg"
                />
                
                {/* Navigation Arrows - Only show if multiple images */}
                {booking.vehicle.images.length > 1 && (
                  <>
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? booking.vehicle.images.length - 1 : prev - 1
                      )}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === booking.vehicle.images.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {booking.vehicle.images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Navigation - Only show if multiple images */}
              {booking.vehicle.images.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {booking.vehicle.images.map((image, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex
                          ? 'border-primary-600 ring-2 ring-primary-200'
                          : 'border-gray-300 hover:border-primary-400'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary-600" />
            Thông tin đặt xe
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pickup Info */}
            <div>
              <div className="flex items-start gap-3 mb-4">
                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    Thời gian nhận xe
                  </div>
                  <div className="text-gray-900 font-medium">
                    {new Date(booking.startDate).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">Điểm nhận xe</div>
                  <div className="text-gray-900 font-medium">
                    {booking.pickupStation?.name || "N/A"}
                  </div>
                  {booking.pickupStation?.address && (
                    <div className="text-sm text-gray-600 mt-1">
                      {typeof booking.pickupStation.address === "string"
                        ? booking.pickupStation.address
                        : `${booking.pickupStation.address.street}, ${booking.pickupStation.address.district}, ${booking.pickupStation.address.city}`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Return Info */}
            <div>
              <div className="flex items-start gap-3 mb-4">
                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    Thời gian trả xe
                  </div>
                  <div className="text-gray-900 font-medium">
                    {new Date(booking.endDate).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">Điểm trả xe</div>
                  <div className="text-gray-900 font-medium">
                    {booking.returnStation?.name || "N/A"}
                  </div>
                  {booking.returnStation?.address && (
                    <div className="text-sm text-gray-600 mt-1">
                      {typeof booking.returnStation.address === "string"
                        ? booking.returnStation.address
                        : `${booking.returnStation.address.street}, ${booking.returnStation.address.district}, ${booking.returnStation.address.city}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Ghi chú</div>
              <div className="text-gray-900">{booking.notes}</div>
            </div>
          )}
        </div>

        {/* Pricing Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Chi tiết thanh toán
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Giá thuê</span>
              <span className="text-gray-900 font-medium">
                {booking.pricing?.basePrice?.toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tiền cọc</span>
              <span className="text-gray-900 font-medium">
                {booking.pricing?.deposit?.toLocaleString("vi-VN")}đ
              </span>
            </div>

            {/* Additional Charges */}
            {(() => {
              console.log("🔍 Checking additionalCharges:", booking.pricing?.additionalCharges);
              console.log("🔍 Is array?", Array.isArray(booking.pricing?.additionalCharges));
              console.log("🔍 Length:", booking.pricing?.additionalCharges?.length);
              return null;
            })()}
            {booking.pricing?.additionalCharges && booking.pricing.additionalCharges.length > 0 && (
              <>
                <div className="border-t border-gray-200 pt-3">
                  <h4 className="font-semibold text-gray-900 mb-2">Chi phí phát sinh</h4>
                  {booking.pricing.additionalCharges.map((charge, idx) => (
                    <div key={idx} className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <span className="text-gray-600 text-sm block">
                          {charge.type === 'late_fee' && '⏰ Phí trả muộn'}
                          {charge.type === 'cleaning' && '🧹 Phí vệ sinh'}
                          {charge.type === 'repair' && '🔧 Phí sửa chữa'}
                          {charge.type !== 'late_fee' && charge.type !== 'cleaning' && charge.type !== 'repair' && charge.type}
                        </span>
                        {charge.description && (
                          <span className="text-gray-500 text-xs">{charge.description}</span>
                        )}
                      </div>
                      <span className="text-red-600 font-medium ml-2">
                        +{charge.amount?.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Additional Payment Info */}
            {(() => {
              console.log("🔍 Checking additionalPayment:", booking.additionalPayment);
              console.log("🔍 Has additionalPayment?", !!booking.additionalPayment);
              return null;
            })()}
            {booking.additionalPayment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Thanh toán bổ sung
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Số tiền đã thanh toán:</span>
                    <span className="font-bold text-yellow-900">
                      {booking.additionalPayment.amount?.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Mã giao dịch:</span>
                    <span className="font-mono text-yellow-900">
                      {booking.additionalPayment.transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Thời gian:</span>
                    <span className="text-yellow-900">
                      {new Date(booking.additionalPayment.paidAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Phương thức:</span>
                    <span className="text-yellow-900">
                      {booking.additionalPayment.method === 'bank_transfer' ? 'Chuyển khoản' : booking.additionalPayment.method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Trạng thái:</span>
                    <span className={`font-semibold ${
                      booking.additionalPayment.status === 'confirmed' ? 'text-green-700' :
                      booking.additionalPayment.status === 'pending' ? 'text-orange-700' : 'text-green-700'
                    }`}>
                      {booking.additionalPayment.status === 'confirmed' && '✅ Đã xác nhận'}
                      {booking.additionalPayment.status === 'pending' && '⏳ Chờ xác nhận'}
                      {booking.additionalPayment.status === 'paid' && '✅ Đã thanh toán'}
                    </span>
                  </div>
                  {booking.additionalPayment.confirmedAt && (
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Xác nhận lúc:</span>
                      <span className="text-yellow-900">
                        {new Date(booking.additionalPayment.confirmedAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Deposit Refund Info */}
            {(() => {
              console.log("🔍 Checking depositRefund:", booking.depositRefund);
              console.log("🔍 Has depositRefund?", !!booking.depositRefund);
              return null;
            })()}
            {/* Show deposit refund - 0đ if pending_return, actual amount after staff processes */}
            {(booking.depositRefund && booking.depositRefund.status !== 'pending_payment') || 
             booking.status === 'pending_return' ? (
              <div className={`border-t border-gray-200 pt-3 ${
                booking.depositRefund?.status === 'not_applicable' ? 'bg-orange-50 -mx-6 -mb-6 p-6 mt-3 rounded-b-lg border-2 border-orange-200' : ''
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className={`font-semibold ${
                      booking.depositRefund?.amount === 0 ? 'text-orange-900' : 'text-gray-900'
                    }`}>
                      {booking.depositRefund?.amount === 0 ? '⚠️ Không hoàn tiền cọc' : 'Hoàn tiền cọc'}
                    </span>
                    {booking.depositRefund?.notes && (
                      <p className={`text-xs mt-1 ${
                        booking.depositRefund.amount === 0 ? 'text-orange-700' : 'text-gray-600'
                      }`}>
                        {booking.depositRefund.notes}
                      </p>
                    )}
                    {booking.status === 'pending_return' && !booking.depositRefund && (
                      <p className="text-xs text-gray-600 mt-1">
                        💡 Chờ staff kiểm tra xe và tính toán chi phí phát sinh
                      </p>
                    )}
                    {booking.depositRefund?.amount === 0 && booking.depositRefund?.status === 'not_applicable' && (
                      <p className="text-xs text-orange-600 mt-2 font-semibold">
                        💡 Chi phí phát sinh đã vượt số tiền cọc. Bạn đã thanh toán đủ chi phí bổ sung.
                      </p>
                    )}
                  </div>
                  <span className={`text-lg font-bold ${
                    booking.depositRefund?.amount === 0 ? 'text-orange-600' : 'text-blue-600'
                  }`}>
                    {booking.depositRefund?.amount !== undefined 
                      ? booking.depositRefund.amount.toLocaleString("vi-VN")
                      : '0'
                    }đ
                  </span>
                </div>
              </div>
            ) : null}

            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  Tổng cộng
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {booking.pricing?.totalAmount?.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Renter Info */}
        {booking.renter && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary-600" />
              Thông tin người thuê
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{booking.renter.fullName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{booking.renter.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{booking.renter.phone}</span>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Info */}
        {booking.status === "cancelled" && booking.cancellation && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              Thông tin hủy đơn
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-red-700 font-medium">Lý do: </span>
                <span className="text-red-900">
                  {booking.cancellation.reason}
                </span>
              </div>
              <div>
                <span className="text-red-700 font-medium">
                  Thời gian hủy:{" "}
                </span>
                <span className="text-red-900">
                  {new Date(booking.cancellation.cancelledAt).toLocaleString(
                    "vi-VN"
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {/* Nút thanh toán cho booking "reserved" */}
        {booking.status === "reserved" && (
          <div className="bg-orange-50 rounded-lg shadow-md p-6 border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-orange-900 mb-1">
                  ⏰ Vui lòng thanh toán để xác nhận đơn
                </h3>
                <p className="text-sm text-orange-700">
                  Đơn sẽ tự động hủy sau:{" "}
                  {booking.reservedUntil &&
                    new Date(booking.reservedUntil).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    toast.loading("Đang tạo link thanh toán...");

                    // Tạo payment link
                    const response = await paymentService.createVNPayUrl(
                      booking._id
                    );

                    toast.dismiss();

                    if (response.data?.paymentUrl) {
                      window.location.href = response.data.paymentUrl;
                    } else {
                      toast.error("Không nhận được link thanh toán");
                    }
                  } catch (error) {
                    toast.dismiss();
                    console.error("Payment error:", error);
                    toast.error(
                      error.response?.data?.message ||
                        "Có lỗi xảy ra khi tạo thanh toán"
                    );
                  }
                }}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Thanh toán ngay
              </button>
            </div>
          </div>
        )}

        {(booking.status === "pending" || booking.status === "confirmed") && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Bạn muốn hủy đơn thuê?
                </h3>
                <p className="text-sm text-gray-600">
                  Đơn thuê có thể được hủy trước khi bắt đầu thuê
                </p>
              </div>
              <button
                onClick={handleCancelBooking}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Hủy đơn thuê
              </button>
            </div>
          </div>
        )}

        {/* Request Return Button - Only for in-progress bookings */}
        {booking.status === "in-progress" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Yêu cầu trả xe
                </h3>
                <p className="text-sm text-gray-600">
                  Gửi yêu cầu trả xe đến staff. Staff sẽ liên hệ với bạn để kiểm tra và nhận xe.
                </p>
              </div>
              <button
                onClick={async () => {
                  const notes = prompt("Ghi chú cho staff (tùy chọn):");
                  if (notes === null) return; // User clicked cancel
                  
                  try {
                    const response = await bookingService.requestReturn(booking._id, {
                      returnNotes: notes,
                      returnLocation: booking.returnStation?.name
                    });
                    toast.success(response.message || "Đã gửi yêu cầu trả xe!");
                    fetchBookingDetail(); // Refresh
                  } catch (error) {
                    toast.error(error.response?.data?.message || "Không thể gửi yêu cầu trả xe");
                  }
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Yêu cầu trả xe
              </button>
            </div>
          </div>
        )}

        {/* Pending Return Status */}
        {booking.status === "pending_return" && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-purple-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-purple-900 mb-1">
                  Đã gửi yêu cầu trả xe
                </h3>
                <p className="text-sm text-purple-700 mb-2">
                  Staff sẽ liên hệ với bạn để sắp xếp thời gian kiểm tra và nhận xe.
                </p>
                {booking.returnRequest?.requestedAt && (
                  <p className="text-xs text-purple-600">
                    Yêu cầu gửi lúc: {new Date(booking.returnRequest.requestedAt).toLocaleString("vi-VN")}
                  </p>
                )}
                {booking.returnRequest?.notes && (
                  <p className="text-sm text-purple-700 mt-2">
                    Ghi chú: {booking.returnRequest.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetailPage;
