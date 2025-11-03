import { useState, useEffect } from "react";
import { staffService } from "../../services";
import toast, { Toaster } from "react-hot-toast";
import {
  Car,
  Battery,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

const StationVehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showBatteryModal, setShowBatteryModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [currentBatteryLevel, setCurrentBatteryLevel] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueSeverity, setIssueSeverity] = useState("low");
  const [submitting, setSubmitting] = useState(false);
  const [station, setStation] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const profileResponse = await staffService.getProfile();
        if (!profileResponse.data.assignedStation) {
          toast("Bạn chưa được phân công trạm nào", {
            icon: '⚠️',
          });
          return;
        }
        setStation(profileResponse.data.assignedStation);
        await fetchVehicles();
      } catch (error) {
        console.error("Error initializing data:", error);
        if (error.response?.status === 401) {
          // Handle unauthorized access
          toast.error("Vui lòng đăng nhập lại");
          // You might want to redirect to login page here
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        }
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (station) {
      fetchVehicles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, station]);

  const [allVehicles, setAllVehicles] = useState([]); // Thêm state mới để lưu tất cả xe

  const fetchVehicles = async () => {
    if (!station) return;

    try {
      setLoading(true);
      const params = {
        station: station._id
      };
      const response = await staffService.getVehicles(params);
      const fetchedVehicles = response.data || [];
      setAllVehicles(fetchedVehicles); // Lưu tất cả xe vào state riêng
      // Chỉ hiển thị xe theo filter
      setVehicles(filter === "all" ? fetchedVehicles : fetchedVehicles.filter(v => v.status === filter));
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      if (error.response?.status === 401) {
        toast.error("Vui lòng đăng nhập lại");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBattery = async () => {
    if (!selectedVehicle || !currentBatteryLevel) return;

    setSubmitting(true);
    try {
      await staffService.updateBattery(
        selectedVehicle._id,
        { batteryLevel: parseFloat(currentBatteryLevel) }
      );
      toast.success("Cập nhật mức pin thành công", {
        icon: '🔋',
      });
      setShowBatteryModal(false);
      setCurrentBatteryLevel("");
      setSelectedVehicle(null);
      fetchVehicles();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể cập nhật mức pin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportIssue = async () => {
    if (!selectedVehicle || !issueDescription) return;

    setSubmitting(true);
    try {
      await staffService.reportVehicleIssue(selectedVehicle._id, {
        description: issueDescription,
        severity: issueSeverity,
      });
      toast.success("Báo cáo sự cố thành công", {
        icon: '⚠️',
      });
      setShowIssueModal(false);
      setIssueDescription("");
      setIssueSeverity("minor");
      setSelectedVehicle(null);
      fetchVehicles();
    } catch (error) {
      console.error("❌ Lỗi gửi báo cáo sự cố:", error.response || error);
      toast.error(error.response?.data?.message || "Không thể gửi báo cáo sự cố");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (vehicle) => {
    const newStatus =
      vehicle.status === "available" ? "unavailable" : "available";

    try {
      await staffService.updateVehicleStatus(vehicle._id, newStatus);
      toast.success(`Đã cập nhật trạng thái phương tiện thành ${newStatus === "available" ? "sẵn sàng" : "không khả dụng"
        }`, {
        icon: newStatus === "available" ? '✅' : '❌',
      });
      fetchVehicles();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể cập nhật trạng thái phương tiện");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: "bg-green-100 text-green-800",
      rented: "bg-blue-100 text-blue-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      unavailable: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getBatteryColor = (level) => {
    if (level >= 80) return "text-green-600";
    if (level >= 50) return "text-yellow-600";
    if (level >= 20) return "text-orange-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: 'green',
            },
          },
          error: {
            style: {
              background: 'red',
            },
          },
        }}
      />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Phương tiện tại trạm</h1>
        <p className="text-gray-600 mt-2">Quản lý phương tiện tại trạm của bạn</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b overflow-x-auto">
          {["all", "available", "rented", "maintenance", "unavailable"].map(
            (tab) => {
              // Tính toán số lượng xe cho mỗi trạng thái dựa trên tất cả xe
              const count = tab === "all"
                ? allVehicles.length
                : allVehicles.filter(v => v.status === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-6 py-3 font-medium capitalize whitespace-nowrap ${filter === tab
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  {tab === "all" ? "Tất cả" :
                    tab === "available" ? "Sẵn sàng" :
                      tab === "rented" ? "Đang thuê" :
                        tab === "maintenance" ? "Bảo trì" :
                          "Không khả dụng"} ({count})
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle._id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Vehicle Image */}
            <div className="h-48 bg-gray-200 relative">
              {vehicle.images && vehicle.images[0] ? (
                <img
                  src={vehicle.images[0]}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                    vehicle.status
                  )}`}
                >
                  {vehicle.status === "available" ? "Sẵn sàng" :
                    vehicle.status === "rented" ? "Đang thuê" :
                      vehicle.status === "maintenance" ? "Bảo trì" :
                        vehicle.status === "unavailable" ? "Không khả dụng" :
                          vehicle.status}
                </span>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-sm text-gray-600 mb-3">{vehicle.year}</p>

              {/* Battery Level */}
              <div className="flex items-center gap-2 mb-3">
                <Battery
                  className={`w-5 h-5 ${getBatteryColor(vehicle.currentBatteryLevel)}`}
                />
                <span
                  className={`text-sm font-medium ${getBatteryColor(
                    vehicle.currentBatteryLevel
                  )}`}
                >
                  {vehicle.currentBatteryLevel}% Pin
                </span>
              </div>

              {/* Vehicle Details */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">Phạm vi:</span>
                  <span className="ml-1 font-medium">{vehicle.range} km</span>
                </div>
                <div>
                  <span className="text-gray-600">Giá thuê:</span>
                  <span className="ml-1 font-medium">
                    {vehicle.pricePerDay?.toLocaleString()}đ/ngày
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Biển số:</span>
                  <span className="ml-1 font-medium">
                    {vehicle.licensePlate}
                  </span>
                </div>
                {/* <div>
                  <span className="text-gray-600">Màu sắc:</span>
                  <span className="ml-1 font-medium capitalize">
                    {vehicle.color}
                  </span>
                </div> */}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setCurrentBatteryLevel(vehicle.currentBatteryLevel.toString());
                    setShowBatteryModal(true);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Battery className="w-4 h-4" />
                  Cập nhật pin
                </button>
                <button
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setShowIssueModal(true);
                  }}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Báo cáo sự cố
                </button>
                <button
                  onClick={() => handleStatusToggle(vehicle)}
                  disabled={vehicle.status === "rented"}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${vehicle.status === "available"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : vehicle.status === "rented"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                >
                  {vehicle.status === "available" ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      Đánh dấu không khả dụng
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Đánh dấu sẵn sàng
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {vehicles.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Không tìm thấy phương tiện nào tại trạm của bạn</p>
        </div>
      )}

      {/* Battery Update Modal */}
      {showBatteryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Cập nhật mức pin</h3>
            <p className="text-gray-600 mb-4">
              {selectedVehicle?.brand} {selectedVehicle?.model} -{" "}
              {selectedVehicle?.licensePlate}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mức pin (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={currentBatteryLevel}
                onChange={(e) => setCurrentBatteryLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpdateBattery}
                disabled={submitting || !currentBatteryLevel}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Đang cập nhật..." : "Cập nhật"}
              </button>
              <button
                onClick={() => {
                  setShowBatteryModal(false);
                  setCurrentBatteryLevel("");
                  setSelectedVehicle(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Báo cáo sự cố phương tiện</h3>
            <p className="text-gray-600 mb-4">
              {selectedVehicle?.brand} {selectedVehicle?.model} -{" "}
              {selectedVehicle?.licensePlate}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả sự cố
              </label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mô tả chi tiết sự cố..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mức độ nghiêm trọng
              </label>
              <select
                value={issueSeverity}
                onChange={(e) => setIssueSeverity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Nhẹ</option>
                <option value="medium">Trung bình</option>
                <option value="high">Nghiêm trọng</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReportIssue}
                disabled={submitting || !issueDescription}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {submitting ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
              <button
                onClick={() => {
                  setShowIssueModal(false);
                  setIssueDescription("");
                  setIssueSeverity("minor");
                  setSelectedVehicle(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationVehiclesPage;
