import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Camera,
  Battery,
  Gauge,
  CheckCircle,
  Check,
  X,
  FileText,
  Car,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

const VehiclePickupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    batteryLevel: 100,
    odometer: 0,
    condition: "good",
    photos: [],
    notes: "",
    signature: "",
    customerConfirmed: false,
  });

  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/staff/bookings/${id}`);
      setBooking(response.data.data);

      // Set initial odometer from vehicle
      if (response.data.data.vehicle?.odometer) {
        setFormData((prev) => ({
          ...prev,
          odometer: response.data.data.vehicle.odometer,
        }));
      }

      // Set initial battery from vehicle
      if (response.data.data.vehicle?.batteryLevel) {
        setFormData((prev) => ({
          ...prev,
          batteryLevel: response.data.data.vehicle.batteryLevel,
        }));
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast.error(
        error.response?.data?.message || "Không thể tải thông tin booking"
      );
      navigate("/staff/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotoFiles((prev) => [...prev, ...files]);

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreview((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreview((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  const uploadPhotos = async () => {
    if (photoFiles.length === 0) return [];

    const uploadedUrls = [];
    for (const file of photoFiles) {
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedUrls.push(response.data.url);
      } catch (error) {
        console.error("Error uploading photo:", error);
        toast.error("Lỗi tải ảnh lên");
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerConfirmed) {
      toast.error("Vui lòng xác nhận khách hàng đã kiểm tra và đồng ý");
      return;
    }

    if (photoFiles.length === 0) {
      toast.error("Vui lòng chụp ít nhất 1 ảnh xe trước khi bàn giao");
      return;
    }

    try {
      setSubmitting(true);
      toast.loading("Đang xử lý bàn giao xe...");

      // Upload photos
      const photoUrls = await uploadPhotos();

      const submitData = {
        batteryLevel: formData.batteryLevel,
        odometer: formData.odometer,
        condition: formData.condition,
        photos: photoUrls,
        notes: formData.notes,
        signature: "",
      };

      const response = await api.put(
        `/staff/bookings/${id}/handover`,
        submitData
      );

      toast.dismiss();
      toast.success(response.data.message);

      navigate(`/staff/bookings/${id}`);
    } catch (error) {
      toast.dismiss();
      console.error("Error handover vehicle:", error);
      toast.error(error.response?.data?.message || "Lỗi bàn giao xe");
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Bàn giao xe</h1>
        <p className="text-gray-600">
          Booking:{" "}
          <span className="font-semibold">{booking.bookingNumber}</span>
        </p>
      </div>

      {/* Booking Info */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-green-700 font-medium">Khách hàng</p>
            <p className="font-bold text-green-900 text-lg">
              {booking.renter?.fullName}
            </p>
            <p className="text-sm text-green-600">{booking.renter?.phone}</p>
          </div>
          <div>
            <p className="text-sm text-green-700 font-medium">Xe</p>
            <p className="font-bold text-green-900 text-lg">
              {booking.vehicle?.brand} {booking.vehicle?.model}
            </p>
            <p className="text-sm text-green-600">
              Biển số: {booking.vehicle?.licensePlate}
            </p>
          </div>
          <div>
            <p className="text-sm text-green-700 font-medium">Thời gian thuê</p>
            <p className="font-semibold text-green-900">
              {new Date(booking.startDate).toLocaleDateString("vi-VN")} -{" "}
              {new Date(booking.endDate).toLocaleDateString("vi-VN")}
            </p>
          </div>
          <div>
            <p className="text-sm text-green-700 font-medium">Tiền cọc</p>
            <p className="font-bold text-green-900 text-lg">
              {booking.pricing?.deposit?.toLocaleString()}đ
            </p>
          </div>
        </div>
      </div>

      {/* Contract Status */}
      {booking.contract?.signed ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-900">Hợp đồng đã ký</p>
            <p className="text-sm text-blue-700">
              Ký lúc:{" "}
              {new Date(booking.contract.signedAt).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <FileText className="w-6 h-6 text-yellow-600" />
          <div>
            <p className="font-semibold text-yellow-900">Chưa ký hợp đồng</p>
            <p className="text-sm text-yellow-700">
              Vui lòng yêu cầu khách hàng ký hợp đồng trước khi bàn giao xe
            </p>
          </div>
        </div>
      )}

      {/* Pickup Inspection Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-md p-6 space-y-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Car className="w-6 h-6" />
          Kiểm tra xe trước bàn giao
        </h2>

        {/* Battery Level */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Battery className="w-4 h-4 mr-2" />
            Mức pin hiện tại
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={formData.batteryLevel}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  batteryLevel: parseInt(e.target.value),
                })
              }
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-lg font-semibold text-gray-900 w-16">
              {formData.batteryLevel}%
            </span>
          </div>
          <div
            className="mt-2 h-2 rounded-full transition-all"
            style={{
              width: `${formData.batteryLevel}%`,
              backgroundColor:
                formData.batteryLevel > 60
                  ? "#10b981"
                  : formData.batteryLevel > 30
                  ? "#f59e0b"
                  : "#ef4444",
            }}
          ></div>
        </div>

        {/* Odometer */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Gauge className="w-4 h-4 mr-2" />
            Số km hiện tại
          </label>
          <input
            type="number"
            value={formData.odometer}
            onChange={(e) =>
              setFormData({ ...formData, odometer: parseInt(e.target.value) })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Nhập số km"
            required
          />
        </div>

        {/* Condition */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <CheckCircle className="w-4 h-4 mr-2" />
            Tình trạng xe
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "good", label: "Tốt", color: "green" },
              { value: "minor_issue", label: "Vấn đề nhỏ", color: "yellow" },
              { value: "needs_repair", label: "Cần sửa", color: "red" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, condition: option.value })
                }
                className={`p-3 rounded-lg border-2 font-medium transition-all ${
                  formData.condition === option.value
                    ? `border-${option.color}-600 bg-${option.color}-50 text-${option.color}-700`
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Camera className="w-4 h-4 mr-2" />
            Hình ảnh xe <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Chụp ảnh toàn cảnh xe, chi tiết quan trọng (bánh xe, gương, đèn,
            thân xe)
          </p>
          {photoPreview.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {photoPreview.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ghi chú
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Ghi chú về tình trạng xe, điều cần lưu ý với khách hàng..."
          />
        </div>

        {/* Digital Signature Placeholder */}
        <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chữ ký điện tử (Tùy chọn)
          </label>
          <p className="text-sm text-gray-500">
            Khách hàng có thể ký trực tiếp trên tablet/điện thoại của bạn
          </p>
          {/* TODO: Add signature pad component */}
          <div className="mt-2 h-32 bg-white rounded border border-gray-300 flex items-center justify-center text-gray-400">
            <p className="text-sm">Vùng ký (Tính năng đang phát triển)</p>
          </div>
        </div>

        {/* Customer Confirmation */}
        <div className="border-t pt-6">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="customerConfirmed"
              checked={formData.customerConfirmed}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customerConfirmed: e.target.checked,
                })
              }
              className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label
              htmlFor="customerConfirmed"
              className="text-sm text-gray-700"
            >
              <span className="font-semibold">Xác nhận:</span> Tôi đã kiểm tra
              xe cùng khách hàng. Khách hàng đã xác nhận tình trạng xe và đồng ý
              nhận xe. Khách hàng đã hiểu rõ các điều khoản trong hợp đồng thuê
              xe.
            </label>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="font-semibold text-yellow-900 mb-2">
            ⚠️ Lưu ý quan trọng:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
            <li>Kiểm tra GPLX còn hiệu lực của khách hàng</li>
            <li>Đảm bảo xe có đủ nhiên liệu/pin để khách hàng sử dụng</li>
            <li>Hướng dẫn khách hàng cách sử dụng xe an toàn</li>
            <li>Cung cấp số hotline hỗ trợ khẩn cấp</li>
            <li>Nhắc khách hàng trả xe đúng giờ để tránh phí phát sinh</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.customerConfirmed}
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
                Xác nhận bàn giao xe
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehiclePickupPage;
