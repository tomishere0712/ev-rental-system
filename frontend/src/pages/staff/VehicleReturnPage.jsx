import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Camera, Battery, Gauge, AlertCircle, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

const VehicleReturnPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    batteryLevel: 85,
    odometer: 0,
    condition: "good",
    photos: [],
    notes: "",
    damageReport: "",
    additionalCharges: {
      cleaning: 0,
      repair: 0,
      lateFee: 0,
    },
    userConfirmed: false,
  });

  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/staff/bookings/${id}`);
      setBooking(response.data.data);

      // Calculate late fee if overdue
      if (response.data.data.endDate) {
        const now = new Date();
        const endDate = new Date(response.data.data.endDate);
        if (now > endDate) {
          const lateHours = Math.ceil((now - endDate) / (1000 * 60 * 60));
          const lateFee =
            lateHours * response.data.data.vehicle.pricePerHour * 1.5;
          setFormData((prev) => ({
            ...prev,
            additionalCharges: {
              ...prev.additionalCharges,
              lateFee: Math.round(lateFee),
            },
          }));
        }
      }

      // Set initial odometer from pickup
      if (response.data.data.pickupDetails?.odometer) {
        setFormData((prev) => ({
          ...prev,
          odometer: response.data.data.pickupDetails.odometer,
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
      // Clean up URL
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

  const calculateTotalCharges = () => {
    const { cleaning, repair, lateFee } = formData.additionalCharges;
    return cleaning + repair + lateFee;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.userConfirmed) {
      toast.error("Vui lòng xác nhận khách hàng đã đồng ý");
      return;
    }

    if (formData.condition !== "good" && !formData.damageReport) {
      toast.error("Vui lòng mô tả tình trạng xe");
      return;
    }

    try {
      setSubmitting(true);
      toast.loading("Đang xử lý trả xe...");

      // Upload photos
      const photoUrls = await uploadPhotos();

      const submitData = {
        ...formData,
        photos: photoUrls,
      };

      const response = await api.put(
        `/staff/bookings/${id}/return`,
        submitData
      );

      toast.dismiss();
      toast.success(response.data.message);

      // Navigate based on result
      if (response.data.data.status === "returning") {
        toast.info(
          "Khách hàng cần thanh toán phí phát sinh trước khi hoàn cọc"
        );
      }

      navigate(`/staff/bookings/${id}`);
    } catch (error) {
      toast.dismiss();
      console.error("Error returning vehicle:", error);
      toast.error(error.response?.data?.message || "Lỗi trả xe");
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

  const totalCharges = calculateTotalCharges();
  const refundAmount = booking.pricing.deposit - totalCharges;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Trả xe</h1>
        <p className="text-gray-600">
          Booking:{" "}
          <span className="font-semibold">{booking.bookingNumber}</span>
        </p>
      </div>

      {/* Booking Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-600">Khách hàng</p>
            <p className="font-semibold text-blue-900">
              {booking.renter.fullName}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-600">Xe</p>
            <p className="font-semibold text-blue-900">
              {booking.vehicle.brand} {booking.vehicle.model}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-600">Ngày thuê</p>
            <p className="font-semibold text-blue-900">
              {new Date(booking.startDate).toLocaleDateString("vi-VN")}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-600">Ngày trả dự kiến</p>
            <p className="font-semibold text-blue-900">
              {new Date(booking.endDate).toLocaleDateString("vi-VN")}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-600">Tiền cọc</p>
            <p className="font-semibold text-blue-900">
              {booking.pricing.deposit.toLocaleString()}đ
            </p>
          </div>
          {booking.pickupDetails?.batteryLevel && (
            <div>
              <p className="text-sm text-blue-600">Pin lúc nhận</p>
              <p className="font-semibold text-blue-900">
                {booking.pickupDetails.batteryLevel}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Return Inspection Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-md p-6 space-y-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Kiểm tra xe
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
            className="mt-2 h-2 rounded-full"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Nhập số km"
            required
          />
        </div>

        {/* Condition */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <AlertCircle className="w-4 h-4 mr-2" />
            Tình trạng xe
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "good", label: "Tốt", color: "green" },
              { value: "minor_issue", label: "Vấn đề nhỏ", color: "yellow" },
              { value: "major_damage", label: "Hư hỏng", color: "red" },
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

        {/* Damage Report */}
        {formData.condition !== "good" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả tình trạng / hư hỏng
            </label>
            <textarea
              value={formData.damageReport}
              onChange={(e) =>
                setFormData({ ...formData, damageReport: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Mô tả chi tiết tình trạng xe, vị trí hư hỏng..."
              required={formData.condition !== "good"}
            />
          </div>
        )}

        {/* Photos */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Camera className="w-4 h-4 mr-2" />
            Hình ảnh xe
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {photoPreview.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {photoPreview.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Ghi chú thêm về tình trạng xe, quá trình trả xe..."
          />
        </div>

        {/* Additional Charges */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Phí phát sinh
          </h3>

          {/* Late Fee */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phí trả muộn{" "}
              {formData.additionalCharges.lateFee > 0 && "(tự động tính)"}
            </label>
            <input
              type="number"
              value={formData.additionalCharges.lateFee}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  additionalCharges: {
                    ...formData.additionalCharges,
                    lateFee: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Cleaning Fee */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phí vệ sinh
            </label>
            <input
              type="number"
              value={formData.additionalCharges.cleaning}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  additionalCharges: {
                    ...formData.additionalCharges,
                    cleaning: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Repair Fee */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phí sửa chữa
            </label>
            <input
              type="number"
              value={formData.additionalCharges.repair}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  additionalCharges: {
                    ...formData.additionalCharges,
                    repair: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tiền cọc:</span>
              <span className="font-medium">
                {booking.pricing.deposit.toLocaleString()}đ
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tổng phí phát sinh:</span>
              <span className="font-medium text-red-600">
                -{totalCharges.toLocaleString()}đ
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Số tiền hoàn lại:</span>
              <span className="text-green-600">
                {refundAmount.toLocaleString()}đ
              </span>
            </div>
          </div>
        </div>

        {/* User Confirmation */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id="userConfirmed"
            checked={formData.userConfirmed}
            onChange={(e) =>
              setFormData({ ...formData, userConfirmed: e.target.checked })
            }
            className="mt-1 mr-3 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="userConfirmed" className="text-sm text-gray-700">
            Tôi xác nhận đã kiểm tra xe cùng khách hàng và khách hàng đồng ý với
            kết quả kiểm tra
            {totalCharges > 0 ? " và các khoản phí phát sinh" : ""}.
          </label>
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
            disabled={submitting || !formData.userConfirmed}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Xác nhận trả xe
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleReturnPage;
