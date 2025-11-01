import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { vehicleService, stationService, bookingService } from "../../services";
import VerificationAlert from "../../components/VerificationAlert";
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  Battery,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

const BookVehiclePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const vehicleIdFromUrl = searchParams.get("vehicleId");

  const [step, setStep] = useState(1); // 1: Select Vehicle, 2: Select Details, 3: Confirm
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    vehicleId: vehicleIdFromUrl || "",
    pickupStationId: "",
    returnStationId: "",
    pickupTime: "",
    expectedReturnTime: "",
    notes: "",
  });

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedPickupStation, setSelectedPickupStation] = useState(null);
  const [selectedReturnStation, setSelectedReturnStation] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  useEffect(() => {
    fetchVehicles();
    fetchStations();
  }, []);

  useEffect(() => {
    if (vehicleIdFromUrl && vehicles.length > 0) {
      const vehicle = vehicles.find((v) => v._id === vehicleIdFromUrl);
      if (vehicle) {
        handleSelectVehicle(vehicle);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleIdFromUrl, vehicles]);

  useEffect(() => {
    calculateEstimatedPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.pickupTime, formData.expectedReturnTime, selectedVehicle]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getVehicles({
        status: "available",
        limit: 100,
      });
      setVehicles(response.data.vehicles);
    } catch (error) {
      toast.error("Không thể tải danh sách xe");
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const response = await stationService.getStations({ limit: 100 });
      setStations(response.data.stations);
    } catch (error) {
      toast.error("Không thể tải danh sách điểm thuê");
    }
  };

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData((prev) => ({ ...prev, vehicleId: vehicle._id }));
    if (step === 1) setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-select station objects
    if (name === "pickupStationId") {
      const station = stations.find((s) => s._id === value);
      setSelectedPickupStation(station);
    }
    if (name === "returnStationId") {
      const station = stations.find((s) => s._id === value);
      setSelectedReturnStation(station);
    }
  };

  const calculateEstimatedPrice = () => {
    if (
      !formData.pickupTime ||
      !formData.expectedReturnTime ||
      !selectedVehicle
    ) {
      setEstimatedPrice(0);
      return;
    }

    const pickup = new Date(formData.pickupTime);
    const returnTime = new Date(formData.expectedReturnTime);
    const hours = Math.max(
      1,
      Math.ceil((returnTime - pickup) / (1000 * 60 * 60))
    );

    const price = hours * (selectedVehicle.pricePerHour || 0);
    setEstimatedPrice(price);
  };

  const validateStep2 = () => {
    if (!formData.pickupStationId) {
      toast.error("Vui lòng chọn điểm lấy xe");
      return false;
    }
    if (!formData.returnStationId) {
      toast.error("Vui lòng chọn điểm trả xe");
      return false;
    }
    if (!formData.pickupTime) {
      toast.error("Vui lòng chọn thời gian lấy xe");
      return false;
    }
    if (!formData.expectedReturnTime) {
      toast.error("Vui lòng chọn thời gian trả xe dự kiến");
      return false;
    }

    const pickup = new Date(formData.pickupTime);
    const returnTime = new Date(formData.expectedReturnTime);
    const now = new Date();

    if (pickup < now) {
      toast.error("Thời gian lấy xe phải sau hiện tại");
      return false;
    }
    if (returnTime <= pickup) {
      toast.error("Thời gian trả xe phải sau thời gian lấy xe");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!user?.isVerified) {
      toast.error("Bạn cần xác thực tài khoản trước khi đặt xe");
      navigate("/renter/profile");
      return;
    }

    try {
      setSubmitting(true);
      const bookingData = {
        vehicle: formData.vehicleId,
        pickupStation: formData.pickupStationId,
        returnStation: formData.returnStationId,
        pickupTime: formData.pickupTime,
        expectedReturnTime: formData.expectedReturnTime,
        notes: formData.notes,
      };

      const response = await bookingService.createBooking(bookingData);
      toast.success("Đặt xe thành công!");
      navigate(`/renter/bookings/${response.data.booking._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Đặt xe thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Đặt xe điện</h1>
        <p className="text-gray-600">Hoàn tất 3 bước để đặt xe của bạn</p>
      </div>

      {/* Verification Alert */}
      <VerificationAlert />

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: "Chọn xe" },
            { num: 2, label: "Chi tiết" },
            { num: 3, label: "Xác nhận" },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s.num
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step > s.num ? <CheckCircle className="w-6 h-6" /> : s.num}
                </div>
                <span
                  className={`text-sm mt-2 font-medium ${
                    step >= s.num ? "text-primary-600" : "text-gray-600"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < 2 && (
                <div
                  className={`h-1 flex-1 mx-4 ${
                    step > s.num ? "bg-primary-600" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Select Vehicle */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Chọn xe bạn muốn thuê
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-40 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không có xe khả dụng</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle._id}
                  onClick={() => handleSelectVehicle(vehicle)}
                  className={`text-left border-2 rounded-lg p-4 transition-all ${
                    selectedVehicle?._id === vehicle._id
                      ? "border-primary-600 bg-primary-50"
                      : "border-gray-200 hover:border-primary-300"
                  }`}
                >
                  <div className="h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                    {vehicle.images?.[0] ? (
                      <img
                        src={vehicle.images[0]}
                        alt={vehicle.name}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <Car className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {vehicle.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {vehicle.type} • {vehicle.model}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary-600">
                      {vehicle.pricePerHour?.toLocaleString("vi-VN")}đ/h
                    </span>
                    <span className="text-sm text-gray-600 flex items-center">
                      <Battery className="w-4 h-4 mr-1" />
                      {vehicle.batteryCapacity}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Booking Details */}
      {step === 2 && selectedVehicle && (
        <div className="space-y-6">
          {/* Selected Vehicle Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Xe đã chọn</h3>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {selectedVehicle.images?.[0] ? (
                  <img
                    src={selectedVehicle.images[0]}
                    alt={selectedVehicle.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Car className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {selectedVehicle.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedVehicle.type} • {selectedVehicle.model}
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Đổi xe
              </button>
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Chi tiết đặt xe
            </h2>

            <div className="space-y-4">
              {/* Pickup Station */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Điểm lấy xe
                </label>
                <select
                  name="pickupStationId"
                  value={formData.pickupStationId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn điểm lấy xe</option>
                  {stations.map((station) => (
                    <option key={station._id} value={station._id}>
                      {station.name} - {station.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Return Station */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Điểm trả xe
                </label>
                <select
                  name="returnStationId"
                  value={formData.returnStationId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn điểm trả xe</option>
                  {stations.map((station) => (
                    <option key={station._id} value={station._id}>
                      {station.name} - {station.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pickup Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Thời gian lấy xe
                </label>
                <input
                  type="datetime-local"
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleInputChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Expected Return Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Thời gian trả xe dự kiến
                </label>
                <input
                  type="datetime-local"
                  name="expectedReturnTime"
                  value={formData.expectedReturnTime}
                  onChange={handleInputChange}
                  min={
                    formData.pickupTime || new Date().toISOString().slice(0, 16)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Yêu cầu đặc biệt, hướng dẫn..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Quay lại
              </button>
              <button
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center"
              >
                Tiếp tục
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Xác nhận đặt xe
            </h2>

            {/* Vehicle Info */}
            <div className="mb-6 pb-6 border-b">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin xe</h3>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                  {selectedVehicle?.images?.[0] ? (
                    <img
                      src={selectedVehicle.images[0]}
                      alt={selectedVehicle.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Car className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-gray-900">
                    {selectedVehicle?.name}
                  </h4>
                  <p className="text-gray-600">
                    {selectedVehicle?.type} • {selectedVehicle?.model}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 flex items-center">
                    <Battery className="w-4 h-4 mr-1" />
                    Pin: {selectedVehicle?.batteryCapacity}% • Quãng đường:{" "}
                    {selectedVehicle?.range}km
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Chi tiết đặt xe
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Điểm lấy xe</p>
                    <p className="font-medium text-gray-900">
                      {selectedPickupStation?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedPickupStation?.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Điểm trả xe</p>
                    <p className="font-medium text-gray-900">
                      {selectedReturnStation?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedReturnStation?.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Thời gian lấy xe</p>
                    <p className="font-medium text-gray-900">
                      {new Date(formData.pickupTime).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Thời gian trả xe</p>
                    <p className="font-medium text-gray-900">
                      {new Date(formData.expectedReturnTime).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {formData.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Ghi chú</p>
                  <p className="text-gray-900">{formData.notes}</p>
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="bg-primary-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-700">Giá thuê</span>
                <span className="font-medium">
                  {selectedVehicle?.pricePerHour?.toLocaleString("vi-VN")}đ/giờ
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-700">Thời gian thuê</span>
                <span className="font-medium">
                  {Math.ceil(
                    (new Date(formData.expectedReturnTime) -
                      new Date(formData.pickupTime)) /
                      (1000 * 60 * 60)
                  )}{" "}
                  giờ
                </span>
              </div>
              <div className="border-t border-primary-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    Tổng tiền dự kiến
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    {estimatedPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  * Giá cuối cùng sẽ được tính dựa trên thời gian thực tế sử
                  dụng
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Quay lại
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !user?.isVerified}
                className="px-8 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Xác nhận đặt xe
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookVehiclePage;
