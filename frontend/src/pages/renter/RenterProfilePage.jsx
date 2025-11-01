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
} from "lucide-react";
import toast from "react-hot-toast";

const RenterProfilePage = () => {
  const { user, setUser } = useAuthStore();
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
      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        toast.error("File không được vượt quá 5MB");
        return;
      }
      setDocuments({
        ...documents,
        [docType]: file,
      });
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await authService.updateProfile(formData);
      setUser(response.data.user);
      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocuments = async () => {
    if (!documents.driverLicense || !documents.nationalId) {
      toast.error("Vui lòng chọn đầy đủ 2 giấy tờ");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("driverLicense", documents.driverLicense);
      formData.append("nationalId", documents.nationalId);

      const response = await authService.uploadDocuments(formData);
      setUser(response.data.user);
      toast.success("Upload giấy tờ thành công! Đang chờ xét duyệt.");
      setDocuments({ driverLicense: null, nationalId: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  const getVerificationStatus = () => {
    if (!user?.driverLicense || !user?.nationalId) {
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
                {user?.driverLicense ? (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <img
                      src={user.driverLicense}
                      alt="Driver License"
                      className="w-full h-48 object-contain mb-2"
                    />
                    <p className="text-sm text-gray-600 text-center">
                      Đã upload
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-primary-600 hover:text-primary-700 font-medium">
                        Chọn file
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "driverLicense")}
                        className="hidden"
                      />
                    </label>
                    {documents.driverLicense && (
                      <p className="text-sm text-gray-600 mt-2">
                        {documents.driverLicense.name}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* National ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CMND/CCCD
                </label>
                {user?.nationalId ? (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <img
                      src={user.nationalId}
                      alt="National ID"
                      className="w-full h-48 object-contain mb-2"
                    />
                    <p className="text-sm text-gray-600 text-center">
                      Đã upload
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-primary-600 hover:text-primary-700 font-medium">
                        Chọn file
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "nationalId")}
                        className="hidden"
                      />
                    </label>
                    {documents.nationalId && (
                      <p className="text-sm text-gray-600 mt-2">
                        {documents.nationalId.name}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {(!user?.driverLicense || !user?.nationalId) && (
                <button
                  onClick={handleUploadDocuments}
                  disabled={
                    uploading ||
                    !documents.driverLicense ||
                    !documents.nationalId
                  }
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "Đang upload..." : "Upload giấy tờ"}
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
