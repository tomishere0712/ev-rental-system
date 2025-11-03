import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, ArrowRight, Home } from "lucide-react";

const PaymentResultPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  
  const bookingId = searchParams.get("bookingId");
  const orderId = searchParams.get("orderId");
  const isSuccess = window.location.pathname.includes("success");
  const isAdditionalPayment = window.location.pathname.includes("additional");
  const errorCode = searchParams.get("code");
  const errorMessage = searchParams.get("error");

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto redirect after countdown
      if (bookingId) {
        navigate(`/renter/bookings/${bookingId}`);
      } else {
        navigate("/renter/bookings");
      }
    }
  }, [countdown, bookingId, navigate]);

  const handleViewBooking = () => {
    if (bookingId) {
      navigate(`/renter/bookings/${bookingId}`);
    } else {
      navigate("/renter/bookings");
    }
  };

  const handleBackHome = () => {
    navigate("/renter/dashboard");
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 text-center">
            {/* Success Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {isAdditionalPayment ? "Thanh toán chi phí phát sinh thành công!" : "Thanh toán thành công!"}
            </h1>
            <p className="text-gray-600 mb-6">
              {isAdditionalPayment 
                ? "Chi phí phát sinh đã được thanh toán. Đơn thuê xe của bạn sẽ sớm được hoàn tất."
                : "Đơn thuê xe của bạn đã được xác nhận"
              }
            </p>

            {/* Order Info */}
            <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-200">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {orderId && (
                  <div className="col-span-2 text-center pb-3 border-b border-green-200">
                    <span className="text-gray-600">Mã giao dịch:</span>
                    <p className="font-semibold text-gray-900 mt-1">#{orderId}</p>
                  </div>
                )}
                <div className="col-span-2 text-center pt-2">
                  <span className="text-green-600 text-lg font-bold">✓ Đã thanh toán</span>
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                Tự động chuyển đến chi tiết đơn thuê sau{" "}
                <span className="font-bold text-lg text-green-600">{countdown}s</span>
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleViewBooking}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Xem chi tiết đơn thuê
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleBackHome}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Về trang chủ
              </button>
            </div>
          </div>

          {/* Success Message */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              🎉 Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Failed page
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 text-center">
          {/* Error Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <XCircle className="w-14 h-14 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {isAdditionalPayment ? "Thanh toán chi phí phát sinh thất bại" : "Thanh toán thất bại"}
          </h1>
          <p className="text-gray-600 mb-6">
            {isAdditionalPayment
              ? "Đã có lỗi xảy ra khi thanh toán chi phí phát sinh"
              : "Đã có lỗi xảy ra trong quá trình thanh toán"
            }
          </p>

          {/* Error Info */}
          <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
            <div className="text-sm">
              {errorCode && (
                <div className="mb-2">
                  <span className="text-gray-600">Mã lỗi:</span>
                  <p className="font-semibold text-red-600 mt-1">{errorCode}</p>
                </div>
              )}
              {errorMessage && (
                <div>
                  <span className="text-gray-600">Chi tiết:</span>
                  <p className="font-medium text-gray-700 mt-1">{errorMessage}</p>
                </div>
              )}
              {!errorCode && !errorMessage && (
                <p className="text-gray-700">
                  Giao dịch đã bị hủy hoặc không thành công
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleViewBooking}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Thử lại thanh toán
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleBackHome}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Về trang chủ
            </button>
          </div>

          {/* Support */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 Nếu cần hỗ trợ, vui lòng liên hệ hotline: <strong>1900-xxxx</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
