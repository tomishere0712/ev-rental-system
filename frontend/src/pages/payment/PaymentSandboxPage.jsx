import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { paymentService } from "../../services";
import { CheckCircle, CreditCard, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const PaymentSandboxPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const amount = parseInt(searchParams.get("amount"));
  const orderCode = searchParams.get("orderCode");

  const [processing, setProcessing] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!bookingId || !amount || !orderCode) {
      toast.error("Thông tin thanh toán không hợp lệ");
      navigate("/renter/bookings");
    }
  }, [bookingId, amount, orderCode, navigate]);

  // Auto countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handlePaymentSuccess = async () => {
    try {
      setProcessing(true);
      
      // Call backend callback
      await paymentService.handleCallback({
        orderCode,
        status: "success",
        bookingId,
      });

      toast.success("Thanh toán thành công!");
      
      // Redirect to booking detail
      navigate(`/renter/bookings/${bookingId}`, {
        state: { paymentSuccess: true }
      });
    } catch (error) {
      console.error("Payment callback error:", error);
      toast.error("Có lỗi xảy ra khi xác nhận thanh toán");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentFailed = async () => {
    try {
      setProcessing(true);
      
      await paymentService.handleCallback({
        orderCode,
        status: "failed",
        bookingId,
      });

      toast.error("Thanh toán thất bại!");
      navigate(`/renter/bookings/${bookingId}`);
    } catch (error) {
      console.error("Payment callback error:", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Payment Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cổng Thanh Toán PayOS
            </h1>
            <p className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 inline-block">
              🔧 Chế độ Sandbox (Demo)
            </p>
          </div>

          {/* Payment Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-blue-200">
              <span className="text-gray-600">Mã đơn hàng:</span>
              <span className="font-semibold text-gray-900">#{orderCode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Số tiền:</span>
              <span className="text-2xl font-bold text-blue-600">
                {amount?.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>

          {/* Countdown */}
          {countdown > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-800">
                  Tự động xác nhận thanh toán thành công sau{" "}
                  <span className="font-bold text-lg">{countdown}s</span>
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePaymentSuccess}
              disabled={processing}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Xác nhận Thanh toán Thành công
                </>
              )}
            </button>

            <button
              onClick={handlePaymentFailed}
              disabled={processing}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <AlertCircle className="w-5 h-5" />
              Mô phỏng Thanh toán Thất bại
            </button>
          </div>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              💡 <strong>Lưu ý:</strong> Đây là môi trường demo/sandbox. 
              Trong thực tế, bạn sẽ quét QR code hoặc chọn phương thức thanh toán.
            </p>
          </div>

          {/* Auto-success timer */}
          {countdown === 0 && !processing && (
            <div className="mt-4">
              {setTimeout(() => handlePaymentSuccess(), 500)}
            </div>
          )}
        </div>

        {/* Supported Methods */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Hỗ trợ thanh toán qua:</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">🏦</span>
            <span className="text-2xl">💳</span>
            <span className="text-2xl">📱</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Banking • Cards • E-wallets • QR Code
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSandboxPage;
