import { useState } from "react";
import PropTypes from "prop-types";
import { X, DollarSign, Check } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

const RefundConfirmationModal = ({ booking, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    transferReference: `REF${Date.now()}`,
    transferNotes: "",
  });

  if (!booking || !booking.depositRefund) {
    return null;
  }

  // Calculate refund amount
  const totalAdditionalCharges =
    booking.pricing.additionalCharges?.reduce(
      (sum, charge) => sum + charge.amount,
      0
    ) || 0;
  const refundAmount = booking.pricing.deposit - totalAdditionalCharges;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.transferReference.trim()) {
      toast.error("Vui lòng nhập mã giao dịch");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(
        `/staff/bookings/${booking._id}/confirm-refund`,
        {
          refundAmount,
          ...formData,
        }
      );

      toast.success(response.data.message);
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error("Error confirming refund:", error);
      toast.error(error.response?.data?.message || "Lỗi xác nhận hoàn tiền");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Xác nhận hoàn tiền</h2>
              <p className="text-green-100">Booking: {booking.bookingNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-green-800 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Booking Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">
              Thông tin khách hàng
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-600">Tên khách hàng</p>
                <p className="font-semibold text-blue-900">
                  {booking.renter?.fullName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-blue-600">Email</p>
                <p className="font-semibold text-blue-900">
                  {booking.renter?.email || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Refund Calculation */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">
              Chi tiết hoàn tiền
            </h3>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tiền cọc ban đầu:</span>
              <span className="font-medium">
                {booking.pricing.deposit.toLocaleString()}đ
              </span>
            </div>

            {booking.pricing.additionalCharges &&
              booking.pricing.additionalCharges.length > 0 && (
                <>
                  <div className="border-t pt-2 space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Phí phát sinh:
                    </p>
                    {booking.pricing.additionalCharges.map((charge, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm pl-4"
                      >
                        <span className="text-gray-600">
                          {charge.type === "late_fee"
                            ? "Phí trả muộn"
                            : charge.type === "cleaning"
                            ? "Phí vệ sinh"
                            : charge.type === "repair"
                            ? "Phí sửa chữa"
                            : charge.type}
                        </span>
                        <span className="font-medium text-red-600">
                          -{charge.amount.toLocaleString()}đ
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-gray-600">Tổng phí phát sinh:</span>
                    <span className="font-medium text-red-600">
                      -{totalAdditionalCharges.toLocaleString()}đ
                    </span>
                  </div>
                </>
              )}

            <div className="flex justify-between text-lg font-bold pt-3 border-t-2">
              <span className="text-gray-900">Số tiền hoàn lại:</span>
              <span className="text-green-600">
                {refundAmount.toLocaleString()}đ
              </span>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã giao dịch / Mã chuyển khoản{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.transferReference}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    transferReference: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="VD: REF123456789"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Mã tham chiếu từ giao dịch chuyển khoản ngân hàng
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú chuyển khoản
              </label>
              <textarea
                value={formData.transferNotes}
                onChange={(e) =>
                  setFormData({ ...formData, transferNotes: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="VD: Đã chuyển khoản qua Vietcombank, STK: 1234567890"
              />
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <div className="text-yellow-600 mt-0.5">⚠️</div>
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận</li>
                <li>
                  Đảm bảo đã chuyển khoản thành công trước khi nhấn xác nhận
                </li>
                <li>Khách hàng sẽ được thông báo để xác nhận nhận tiền</li>
                <li>
                  Sau khi khách hàng xác nhận, booking sẽ được đánh dấu hoàn
                  thành
                </li>
              </ul>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Xác nhận đã chuyển khoản
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

RefundConfirmationModal.propTypes = {
  booking: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    bookingNumber: PropTypes.string.isRequired,
    renter: PropTypes.shape({
      fullName: PropTypes.string,
      email: PropTypes.string,
    }),
    pricing: PropTypes.shape({
      deposit: PropTypes.number.isRequired,
      additionalCharges: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string,
          amount: PropTypes.number,
          description: PropTypes.string,
        })
      ),
    }).isRequired,
    depositRefund: PropTypes.shape({
      status: PropTypes.string,
      amount: PropTypes.number,
      transferReference: PropTypes.string,
      transferNotes: PropTypes.string,
      refundedAt: PropTypes.string,
      refundedBy: PropTypes.string,
    }),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default RefundConfirmationModal;
