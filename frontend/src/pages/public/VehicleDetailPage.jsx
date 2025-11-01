import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Battery,
  MapPin,
  Clock,
  DollarSign,
  Zap,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Car,
} from "lucide-react";
import { vehicleService } from "../../services";
import toast from "react-hot-toast";

const VehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        setLoading(true);
        const response = await vehicleService.getById(id);
        setVehicle(response.data);
      } catch (error) {
        toast.error("Không thể tải thông tin xe");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleDetails();
  }, [id]);

  const handleBooking = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt xe");
      navigate("/login", { state: { from: `/vehicles/${id}` } });
      return;
    }
    navigate(`/book/${id}`);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: {
        label: "Có sẵn",
        className: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      rented: {
        label: "Đang thuê",
        className: "bg-blue-100 text-blue-800",
        icon: Clock,
      },
      maintenance: {
        label: "Bảo trì",
        className: "bg-yellow-100 text-yellow-800",
        icon: AlertCircle,
      },
      charging: {
        label: "Đang sạc",
        className: "bg-purple-100 text-purple-800",
        icon: Zap,
      },
      unavailable: {
        label: "Không khả dụng",
        className: "bg-red-100 text-red-800",
        icon: AlertCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.unavailable;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}
      >
        <Icon className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    );
  };

  const getVehicleTypeName = (type) => {
    const types = {
      scooter: "Xe máy điện",
      motorcycle: "Mô tô điện",
      car: "Ô tô điện",
      bike: "Xe đạp điện",
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin xe...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy xe
          </h2>
          <p className="text-gray-600 mb-4">
            Xe bạn đang tìm kiếm không tồn tại hoặc đã bị xóa
          </p>
          <Link
            to="/vehicles"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách xe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <img
                  src={
                    vehicle.images?.[selectedImage] ||
                    "https://via.placeholder.com/800x450?text=No+Image"
                  }
                  alt={vehicle.name}
                  className="w-full h-96 object-cover"
                />
              </div>

              {/* Thumbnail Images */}
              {vehicle.images?.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {vehicle.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? "border-primary-600"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${vehicle.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {vehicle.name}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {vehicle.brand} {vehicle.model} ({vehicle.year})
                  </p>
                </div>
                {getStatusBadge(vehicle.status)}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Car className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loại xe</p>
                  <p className="font-semibold text-gray-900">
                    {getVehicleTypeName(vehicle.type)}
                  </p>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Battery className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Pin hiện tại</p>
                  <p className="font-semibold text-gray-900">
                    {vehicle.currentBatteryLevel}%
                  </p>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Zap className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Quãng đường</p>
                  <p className="font-semibold text-gray-900">
                    {vehicle.range} km
                  </p>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Đã đi</p>
                  <p className="font-semibold text-gray-900">
                    {vehicle.odometer?.toLocaleString()} km
                  </p>
                </div>
              </div>

              {/* Battery Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Thông tin pin
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Dung lượng pin</span>
                    <span className="font-medium text-gray-900">
                      {vehicle.batteryCapacity} kWh
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Mức pin hiện tại</span>
                    <div className="flex items-center">
                      <div className="w-32 h-3 bg-gray-200 rounded-full mr-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            vehicle.currentBatteryLevel > 50
                              ? "bg-green-500"
                              : vehicle.currentBatteryLevel > 20
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${vehicle.currentBatteryLevel}%` }}
                        ></div>
                      </div>
                      <span className="font-medium text-gray-900">
                        {vehicle.currentBatteryLevel}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Quãng đường tối đa</span>
                    <span className="font-medium text-gray-900">
                      {vehicle.range} km
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Tính năng nổi bật
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {vehicle.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center text-gray-700"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              {vehicle.currentStation && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Điểm thuê
                  </h3>
                  <div className="flex items-start bg-gray-50 p-4 rounded-lg">
                    <MapPin className="w-5 h-5 text-primary-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {vehicle.currentStation.name}
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        {vehicle.currentStation.address?.street},{" "}
                        {vehicle.currentStation.address?.district}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance Info */}
              {vehicle.lastMaintenanceDate && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Thông tin bảo trì
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Bảo trì lần cuối</span>
                      <span className="font-medium text-gray-900">
                        {new Date(
                          vehicle.lastMaintenanceDate
                        ).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    {vehicle.nextMaintenanceDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Bảo trì tiếp theo</span>
                        <span className="font-medium text-gray-900">
                          {new Date(
                            vehicle.nextMaintenanceDate
                          ).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Issues */}
              {vehicle.currentIssues && vehicle.currentIssues.length > 0 && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                    Vấn đề hiện tại
                  </h3>
                  <div className="space-y-2">
                    {vehicle.currentIssues.map((issue, index) => (
                      <div
                        key={index}
                        className="flex items-start bg-yellow-50 p-3 rounded-lg"
                      >
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium mr-3 ${
                            issue.severity === "high"
                              ? "bg-red-100 text-red-800"
                              : issue.severity === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {issue.severity === "high"
                            ? "Cao"
                            : issue.severity === "medium"
                            ? "Trung bình"
                            : "Thấp"}
                        </span>
                        <p className="text-gray-700">{issue.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Giá thuê
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Theo giờ</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {vehicle.pricePerHour?.toLocaleString()}đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Theo ngày</span>
                    <span className="text-xl font-bold text-gray-900">
                      {vehicle.pricePerDay?.toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Đặt cọc</span>
                  <span className="font-medium text-gray-900">
                    {vehicle.deposit?.toLocaleString()}đ
                  </span>
                </div>
              </div>

              {vehicle.status === "available" ? (
                <>
                  <button
                    onClick={handleBooking}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-3"
                  >
                    <Calendar className="w-5 h-5 inline-block mr-2" />
                    Đặt xe ngay
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Miễn phí hủy trong 24 giờ
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-2">
                    Xe hiện không khả dụng
                  </p>
                  <p className="text-sm text-gray-500">
                    {vehicle.status === "rented"
                      ? "Xe đang được thuê bởi khách hàng khác"
                      : vehicle.status === "maintenance"
                      ? "Xe đang trong quá trình bảo trì"
                      : vehicle.status === "charging"
                      ? "Xe đang được sạc pin"
                      : "Vui lòng chọn xe khác"}
                  </p>
                  <Link
                    to="/vehicles"
                    className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Xem xe khác
                  </Link>
                </div>
              )}

              {/* Additional Info */}
              <div className="mt-6 pt-6 border-t space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Bảo hiểm toàn diện</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Hỗ trợ 24/7</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Miễn phí sạc tại điểm thuê</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailPage;
