import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services";
import {
  User,
  Mail,
  Phone,
  Upload,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const RenterProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [documents, setDocuments] = useState({
    driverLicense: null,
    nationalId: null,
  });
  const [previews, setPreviews] = useState({
    driverLicense: null,
    nationalId: null,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e, docType) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File không được vượt quá 5MB", {
          duration: 4000,
          icon: "⚠️",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Chỉ chấp nhận file ảnh (JPG, PNG, etc.)", {
          duration: 4000,
          icon: "⚠️",
        });
        return;
      }

      setDocuments({
        ...documents,
        [docType]: file,
      });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews({
          ...previews,
          [docType]: reader.result,
        });
      };
      reader.readAsDataURL(file);

      toast.success(`Đã chọn ${docType === "driverLicense" ? "Giấy phép lái xe" : "CMND/CCCD"}`, {
        duration: 2000,
      });
    }
  };

  const handleRemoveFile = (docType) => {
    setDocuments({
      ...documents,
      [docType]: null,
    });
    setPreviews({
      ...previews,
      [docType]: null,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await authService.updateProfile(formData);
      updateUser(response.data.user);
      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocuments = async () => {
    if (!documents.driverLicense || !documents.nationalId) {
      toast.error("Vui lòng chọn đầy đủ 2 giấy tờ", {
        duration: 4000,
        icon: "⚠️",
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("driverLicense", documents.driverLicense);
      formData.append("nationalId", documents.nationalId);

      const response = await authService.uploadDocuments(formData);
      
      if (response.success) {
        updateUser(response.data.user);
        toast.success("Upload giấy tờ thành công! Đang chờ xét duyệt.", {
          duration: 5000,
          icon: "✅",
        });
        // Clear documents and previews
        setDocuments({ driverLicense: null, nationalId: null });
        setPreviews({ driverLicense: null, nationalId: null });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Upload thất bại. Vui lòng thử lại!", {
        duration: 5000,
        icon: "❌",
      });
    } finally {
      setUploading(false);
    }
  };

  const getVerificationStatus = () => {
    // Kiểm tra chính xác xem có URL ảnh hay không
    const hasDriverLicense = user?.driverLicense && typeof user.driverLicense === 'string' && user.driverLicense.length > 0;
    const hasNationalId = user?.nationalId && typeof user.nationalId === 'string' && user.nationalId.length > 0;
    
    if (!hasDriverLicense || !hasNationalId) {
      return {
        status: "missing",
        icon: <AlertCircle className="w-5 h-5" />,
        text: "Chưa upload giấy tờ",
        color: "text-yellow-600 bg-yellow-100",
      };
    }
    if (user.isVerified) {
      return {
        status: "verified",
        icon: <CheckCircle className="w-5 h-5" />,
        text: "Đã xác thực",
        color: "text-green-600 bg-green-100",
      };
    }
    return {
      status: "pending",
      icon: <AlertCircle className="w-5 h-5" />,
      text: "Đang chờ xét duyệt",
      color: "text-blue-600 bg-blue-100",
    };
  };

  const verification = getVerificationStatus();

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ của tôi</h1>
      <p className="text-gray-600 mb-8">
        Quản lý thông tin cá nhân và giấy tờ xác thực
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary-600" />
              Thông tin cơ bản
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email không thể thay đổi
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  "Đang lưu..."
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Document Upload Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-primary-600" />
              Giấy tờ xác thực
            </h2>

            {user?.isVerified ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">
                      Tài khoản đã được xác thực
                    </h3>
                    <p className="text-sm text-green-700">
                      Bạn đã có thể đặt xe và sử dụng đầy đủ các tính năng của
                      hệ thống.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">
                      Yêu cầu xác thực
                    </h3>
                    <p className="text-sm text-yellow-700">
                      Vui lòng upload Giấy phép lái xe và CMND/CCCD để có thể
                      đặt xe.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Driver License */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giấy phép lái xe
                </label>
                {user?.driverLicense && typeof user.driverLicense === 'string' && user.driverLicense.length > 0 ? (
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <img
                      src={user.driverLicense}
                      alt="Driver License"
                      className="w-full h-48 object-contain mb-2 rounded"
                    />
                    <div className="flex items-center justify-center text-sm text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Đã upload
                    </div>
                  </div>
                ) : previews.driverLicense ? (
                  <div className="border border-primary-300 rounded-lg p-4 bg-primary-50">
                    <div className="relative">
                      <img
                        src={previews.driverLicense}
                        alt="Preview"
                        className="w-full h-48 object-contain mb-2 rounded"
                      />
                      <button
                        onClick={() => handleRemoveFile("driverLicense")}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      <ImageIcon className="w-4 h-4 inline mr-1" />
                      {documents.driverLicense?.name}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <label className="cursor-pointer">
                      <span className="text-primary-600 hover:text-primary-700 font-medium text-lg">
                        Chọn ảnh Giấy phép lái xe
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        PNG, JPG, JPEG (Tối đa 5MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "driverLicense")}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* National ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CMND/CCCD
                </label>
                {user?.nationalId && typeof user.nationalId === 'string' && user.nationalId.length > 0 ? (
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <img
                      src={user.nationalId}
                      alt="National ID"
                      className="w-full h-48 object-contain mb-2 rounded"
                    />
                    <div className="flex items-center justify-center text-sm text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Đã upload
                    </div>
                  </div>
                ) : previews.nationalId ? (
                  <div className="border border-primary-300 rounded-lg p-4 bg-primary-50">
                    <div className="relative">
                      <img
                        src={previews.nationalId}
                        alt="Preview"
                        className="w-full h-48 object-contain mb-2 rounded"
                      />
                      <button
                        onClick={() => handleRemoveFile("nationalId")}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      <ImageIcon className="w-4 h-4 inline mr-1" />
                      {documents.nationalId?.name}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <label className="cursor-pointer">
                      <span className="text-primary-600 hover:text-primary-700 font-medium text-lg">
                        Chọn ảnh CMND/CCCD
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        PNG, JPG, JPEG (Tối đa 5MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "nationalId")}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Chỉ hiển thị nút upload khi chưa có cả 2 giấy tờ */}
              {!(user?.driverLicense && typeof user.driverLicense === 'string' && user.driverLicense.length > 0 && 
                 user?.nationalId && typeof user.nationalId === 'string' && user.nationalId.length > 0) && (
                <button
                  onClick={handleUploadDocuments}
                  disabled={
                    uploading ||
                    !documents.driverLicense ||
                    !documents.nationalId
                  }
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang upload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload giấy tờ
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Verification Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Trạng thái xác thực
            </h3>
            <div
              className={`${verification.color} rounded-lg p-4 flex items-center`}
            >
              {verification.icon}
              <span className="ml-2 font-medium">{verification.text}</span>
            </div>
          </div>

          {/* Risk Assessment */}
          {user?.riskAssessment && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Đánh giá</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Điểm tín nhiệm</span>
                  <span className="font-semibold">
                    {user.riskAssessment.score}/100
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mức độ</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      user.riskAssessment.level === "low"
                        ? "bg-green-100 text-green-800"
                        : user.riskAssessment.level === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.riskAssessment.level === "low"
                      ? "Thấp"
                      : user.riskAssessment.level === "medium"
                      ? "Trung bình"
                      : "Cao"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Số chuyến</span>
                  <span className="font-semibold">
                    {user.riskAssessment.totalBookings}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Account Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Thông tin tài khoản
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Vai trò:</span>
                <span className="ml-2 font-medium capitalize">
                  {user?.role}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Ngày tham gia:</span>
                <span className="ml-2 font-medium">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenterProfilePage;
