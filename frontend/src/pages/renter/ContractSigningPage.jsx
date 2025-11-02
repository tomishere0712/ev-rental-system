import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Check,
  AlertCircle,
  Calendar,
  Car,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

const ContractSigningPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bookings/${id}`);
      setBooking(response.data.data);

      // If already signed, show message
      if (response.data.data.contract?.signed) {
        toast.success("Hợp đồng đã được ký");
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast.error(
        error.response?.data?.message || "Không thể tải thông tin booking"
      );
      navigate("/renter/bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    if (!agreed) {
      toast.error("Vui lòng đọc và đồng ý với các điều khoản hợp đồng");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/bookings/${id}/sign-contract`, {
        agreedToTerms: true,
      });

      toast.success("Ký hợp đồng thành công!");
      setBooking(response.data.data);
    } catch (error) {
      console.error("Error signing contract:", error);
      toast.error(error.response?.data?.message || "Lỗi ký hợp đồng");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Không tìm thấy booking</p>
      </div>
    );
  }

  const contractTerms = `
HỢP ĐỒNG THUÊ XE ĐIỆN

I. THÔNG TIN BÊN THUÊ
- Họ và tên: ${booking.renter?.fullName}
- Email: ${booking.renter?.email}
- Số điện thoại: ${booking.renter?.phone || "N/A"}

II. THÔNG TIN XE THUÊ
- Loại xe: ${booking.vehicle?.brand} ${booking.vehicle?.model}
- Biển số: ${booking.vehicle?.licensePlate}
- Màu sắc: ${booking.vehicle?.color || "N/A"}

III. THỜI GIAN THUÊ
- Ngày bắt đầu: ${new Date(booking.startDate).toLocaleString("vi-VN")}
- Ngày kết thúc: ${new Date(booking.endDate).toLocaleString("vi-VN")}
- Địa điểm nhận: ${booking.pickupStation?.name}
- Địa điểm trả: ${booking.returnStation?.name}

IV. CHI PHÍ
- Giá thuê: ${booking.pricing?.basePrice?.toLocaleString() || 0}đ
- Tiền cọc: ${booking.pricing?.deposit?.toLocaleString() || 0}đ
- Tổng cộng: ${booking.pricing?.totalAmount?.toLocaleString() || 0}đ

V. ĐIỀU KHOẢN VÀ ĐIỀU KIỆN

1. Trách nhiệm của bên thuê:
   - Giữ gìn xe cẩn thận như tài sản của mình
   - Tuân thủ luật giao thông và quy định sử dụng xe điện
   - Không cho người khác mượn hoặc chuyển nhượng hợp đồng
   - Trả xe đúng giờ, đúng địa điểm đã thỏa thuận
   - Thanh toán đầy đủ các chi phí phát sinh (nếu có)

2. Trách nhiệm của bên cho thuê:
   - Cung cấp xe trong tình trạng tốt, đã kiểm tra an toàn
   - Hỗ trợ khẩn cấp 24/7 trong thời gian thuê
   - Hướng dẫn sử dụng xe đầy đủ
   - Hoàn trả tiền cọc sau khi kiểm tra xe không có hư hỏng

3. Phí phát sinh:
   - Trả muộn: 150% giá thuê theo giờ
   - Vệ sinh xe: 50,000 - 200,000đ tùy mức độ
   - Sửa chữa: Tính theo chi phí thực tế
   - Vi phạm giao thông: Do bên thuê chịu trách nhiệm

4. Bảo hiểm:
   - Xe được bảo hiểm dân sự bắt buộc
   - Thiệt hại do lỗi người thuê sẽ được khấu trừ từ tiền cọc
   - Trường hợp thiệt hại vượt quá tiền cọc, bên thuê phải bồi thường

5. Hủy hợp đồng:
   - Hủy trước 24h: Hoàn 100% tiền đã đặt
   - Hủy trước 12h: Hoàn 50% tiền đã đặt
   - Hủy trong 12h: Không hoàn tiền

6. Điều khoản khác:
   - Không được sử dụng xe vào mục đích phi pháp
   - Không được hút thuốc trong xe
   - Không được chở quá số người quy định
   - Vi phạm hợp đồng có thể dẫn đến chấm dứt quyền thuê và mất tiền cọc

VII. XÁC NHẬN

Tôi đã đọc, hiểu rõ và đồng ý với tất cả các điều khoản trong hợp đồng này.
Tôi cam kết thực hiện đúng các quy định và chịu trách nhiệm về mọi hành vi của mình trong thời gian thuê xe.

Ngày ký: ${new Date().toLocaleDateString("vi-VN")}
Booking Number: ${booking.bookingNumber}
  `;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Hợp đồng thuê xe
            </h1>
            <p className="text-gray-600">Booking: {booking.bookingNumber}</p>
          </div>
        </div>

        {booking.contract?.signed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <Check className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">
                Hợp đồng đã được ký
              </p>
              <p className="text-sm text-green-700">
                Ký lúc:{" "}
                {new Date(booking.contract.signedAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Booking Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">
          Thông tin đặt xe
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Car className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-700">Xe</p>
              <p className="font-semibold text-blue-900">
                {booking.vehicle?.brand} {booking.vehicle?.model}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-700">Thời gian</p>
              <p className="font-semibold text-blue-900">
                {new Date(booking.startDate).toLocaleDateString("vi-VN")} -{" "}
                {new Date(booking.endDate).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-700">Tổng chi phí</p>
              <p className="font-semibold text-blue-900">
                {booking.pricing?.totalAmount?.toLocaleString()}đ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-700">Tiền cọc</p>
              <p className="font-semibold text-blue-900">
                {booking.pricing?.deposit?.toLocaleString()}đ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Nội dung hợp đồng
        </h2>
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
            {contractTerms}
          </pre>
        </div>
      </div>

      {/* Agreement Checkbox */}
      {!booking.contract?.signed && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="agree" className="text-sm text-gray-700">
              <span className="font-semibold">
                Tôi đã đọc kỹ và đồng ý với tất cả các điều khoản trong hợp đồng
                này.
              </span>{" "}
              Tôi hiểu rằng việc ký hợp đồng này có giá trị pháp lý và tôi cam
              kết thực hiện đúng các quy định đã nêu.
            </label>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Vui lòng đọc kỹ toàn bộ hợp đồng trước khi ký</li>
                <li>Sau khi ký, bạn cần đến điểm nhận xe đúng giờ</li>
                <li>Mang theo GPLX và CCCD gốc khi nhận xe</li>
                <li>Staff sẽ kiểm tra giấy tờ và bàn giao xe cho bạn</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleSignContract}
            disabled={!agreed || submitting}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Ký hợp đồng điện tử
              </>
            )}
          </button>
        </div>
      )}

      {/* Next Steps */}
      {booking.contract?.signed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-3">
            ✅ Các bước tiếp theo:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-green-800">
            <li>Đến điểm nhận xe đúng giờ: {booking.pickupStation?.name}</li>
            <li>Mang theo GPLX và CCCD gốc</li>
            <li>Staff sẽ kiểm tra giấy tờ và bàn giao xe</li>
            <li>Kiểm tra tình trạng xe cùng staff và chụp ảnh</li>
            <li>Nhận xe và bắt đầu hành trình!</li>
          </ol>
          <button
            onClick={() => navigate(`/renter/bookings/${id}`)}
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Xem chi tiết booking
          </button>
        </div>
      )}
    </div>
  );
};

export default ContractSigningPage;
