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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'select' or 'back'
  const [tempSelectedVehicle, setTempSelectedVehicle] = useState(null);

  const [formData, setFormData] = useState({
    vehicleId: vehicleIdFromUrl || "",
    pickupStationId: "",
    returnStationId: "",
    pickupTime: "",
    expectedReturnTime: "",
    rentalType: "hour", // "hour" or "day"
    paymentMethod: "cash", // cash or bank_transfer
    documentVerification: "", // at_station or from_profile
    notes: "",
  });

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedPickupStation, setSelectedPickupStation] = useState(null);
  const [selectedReturnStation, setSelectedReturnStation] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);

  useEffect(() => {
    if (vehicleIdFromUrl) {
      // If we have a specific vehicle ID, fetch it directly
      fetchSpecificVehicle(vehicleIdFromUrl);
    } else {
      // Otherwise, fetch all available vehicles
      fetchVehicles();
    }
    fetchStations();
  }, [vehicleIdFromUrl]);

  useEffect(() => {
    calculateEstimatedPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.pickupTime, formData.expectedReturnTime, selectedVehicle]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      console.log("Fetching vehicles...");
      const response = await vehicleService.getVehicles({
        status: "available",
        limit: 100,
      });
      console.log("Vehicles response:", response);
      setVehicles(response.data.vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Không thể tải danh sách xe");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecificVehicle = async (vehicleId) => {
    try {
      setLoading(true);
      console.log("Fetching specific vehicle:", vehicleId);
      const response = await vehicleService.getById(vehicleId);
      console.log("Vehicle response:", response);
      
      if (response.data) {
        const vehicle = response.data;
        setSelectedVehicle(vehicle);
        setFormData((prev) => ({ ...prev, vehicleId: vehicle._id }));
        setStep(2); // Skip step 1, go directly to booking details
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      toast.error("Không thể tải thông tin xe");
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      console.log("Fetching stations...");
      const response = await stationService.getStations({ limit: 100 });
      console.log("Stations response:", response);
      setStations(response.data.stations);
    } catch (error) {
      console.error("Error fetching stations:", error);
      toast.error("Không thể tải danh sách điểm thuê");
    }
  };

  const handleSelectVehicle = (vehicle) => {
    setTempSelectedVehicle(vehicle);
    setConfirmAction('select');
    setShowConfirmModal(true);
  };

  const confirmSelectVehicle = () => {
    if (tempSelectedVehicle) {
      setSelectedVehicle(tempSelectedVehicle);
      setFormData((prev) => ({ ...prev, vehicleId: tempSelectedVehicle._id }));
      if (step === 1) setStep(2);
    }
    setShowConfirmModal(false);
    setTempSelectedVehicle(null);
  };

  const handleBackToStep1 = () => {
    setConfirmAction('back');
    setShowConfirmModal(true);
  };

  const confirmBackToStep1 = () => {
    setStep(1);
    // If we don't have vehicles list yet, fetch them
    if (vehicles.length === 0) {
      fetchVehicles();
    }
    setShowConfirmModal(false);
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
      setDepositAmount(0);
      return;
    }

    const pickup = new Date(formData.pickupTime);
    const returnTime = new Date(formData.expectedReturnTime);

    if (formData.rentalType === "day") {
      // Rental by day - use pricePerDay
      const totalDays = Math.max(
        1,
        Math.ceil((returnTime - pickup) / (1000 * 60 * 60 * 24))
      );
      const price = totalDays * (selectedVehicle.pricePerDay || 0);
      const deposit = selectedVehicle.deposit || 0;
      
      setEstimatedPrice(price);
      setDepositAmount(deposit);
    } else {
      // Rental by hour - use pricePerHour with peak hour calculation
      const totalHours = Math.max(
        1,
        Math.ceil((returnTime - pickup) / (1000 * 60 * 60))
      );

      // Calculate peak hours (5 PM - 7 PM = 17:00 - 19:00)
      let peakHours = 0;
      let currentTime = new Date(pickup);
      
      for (let i = 0; i < totalHours; i++) {
        const hour = currentTime.getHours();
        // Peak hours: 17:00 (5 PM) to 18:59 (before 7 PM)
        if (hour >= 17 && hour < 19) {
          peakHours++;
        }
        currentTime.setHours(currentTime.getHours() + 1);
      }

      const normalHours = totalHours - peakHours;
      const basePrice = selectedVehicle.pricePerHour || 0;
      const peakPrice = basePrice * 1.2; // 20% increase for peak hours

      const price = (normalHours * basePrice) + (peakHours * peakPrice);
      const deposit = selectedVehicle.deposit || 0;
      
      setEstimatedPrice(price);
      setDepositAmount(deposit);
    }
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
    if (!formData.paymentMethod) {
      toast.error("Vui lòng chọn phương thức thanh toán");
      return false;
    }
    if (!formData.documentVerification) {
      toast.error("Vui lòng chọn hình thức xác thực giấy tờ");
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
    try {
      setSubmitting(true);
      
      // Calculate pricing details
      const pickup = new Date(formData.pickupTime);
      const returnTime = new Date(formData.expectedReturnTime);
      
      let basePrice = 0;
      let totalAmount = estimatedPrice;
      
      if (formData.rentalType === 'day') {
        const duration = Math.max(1, Math.ceil((returnTime - pickup) / (1000 * 60 * 60 * 24)));
        basePrice = selectedVehicle.pricePerDay || 0;
      } else {
        const duration = Math.max(1, Math.ceil((returnTime - pickup) / (1000 * 60 * 60)));
        basePrice = selectedVehicle.pricePerHour || 0;
      }
      
      const bookingData = {
        vehicle: formData.vehicleId,
        station: formData.pickupStationId, // Main station reference (required)
        pickupStation: formData.pickupStationId,
        returnStation: formData.returnStationId,
        startDate: formData.pickupTime,
        endDate: formData.expectedReturnTime,
        pricing: {
          basePrice: basePrice,
          totalAmount: totalAmount,
          deposit: depositAmount
        },
        notes: formData.notes || ""
      };

      console.log("Booking data being sent:", bookingData);
      
      const response = await bookingService.create(bookingData);
      console.log("Booking response:", response);
      toast.success("Đặt xe thành công!");
      
      // Backend returns response.data directly
      const bookingId = response.data?._id || response.data?.data?._id;
      if (bookingId) {
        navigate(`/renter/bookings/${bookingId}`);
      } else {
        console.error("No booking ID found in response");
        navigate('/renter/bookings');
      }
    } catch (error) {
      console.error("Booking error:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || "Đặt xe thất bại";
      toast.error(errorMessage);
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

      {/* Loading State */}
      {loading && step === 1 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin xe...</p>
        </div>
      )}

      {/* If vehicle not found after loading */}
      {!loading && vehicleIdFromUrl && !selectedVehicle && vehicles.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Không tìm thấy xe
          </h3>
          <p className="text-gray-600 mb-4">
            Xe này có thể không còn khả dụng hoặc đã bị xóa
          </p>
          <button
            onClick={() => navigate("/vehicles")}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Xem danh sách xe khác
          </button>
        </div>
      )}

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
                      {vehicle.currentBatteryLevel}%
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
                onClick={handleBackToStep1}
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

            <div className="space-y-6">
              {/* Vehicle Full Info */}
              <div className="bg-gradient-to-r from-primary-50 to-green-50 rounded-lg p-4 border border-primary-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Car className="w-5 h-5 mr-2 text-primary-600" />
                  Thông tin xe
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Tên xe:</span> <span className="font-medium">{selectedVehicle.name}</span></p>
                    <p><span className="text-gray-600">Loại:</span> <span className="font-medium">{selectedVehicle.type}</span></p>
                    <p><span className="text-gray-600">Model:</span> <span className="font-medium">{selectedVehicle.model}</span></p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center">
                      <Battery className="w-4 h-4 mr-1 text-green-600" />
                      <span className="text-gray-600">Pin:</span> 
                      <span className="font-medium ml-1">{selectedVehicle.batteryCapacity || selectedVehicle.currentBatteryLevel}%</span>
                    </p>
                    <p><span className="text-gray-600">Quãng đường:</span> <span className="font-medium">{selectedVehicle.range}km</span></p>
                    <p className="text-lg">
                      <span className="text-gray-600">Giá thuê theo giờ:</span> 
                      <span className="font-bold text-primary-600 ml-1">{selectedVehicle.pricePerHour?.toLocaleString("vi-VN")}đ/giờ</span>
                    </p>
                    <p className="text-lg">
                      <span className="text-gray-600">Giá thuê theo ngày:</span> 
                      <span className="font-bold text-primary-600 ml-1">{selectedVehicle.pricePerDay?.toLocaleString("vi-VN")}đ/ngày</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Rental Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Loại hình thuê
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.rentalType === 'hour' 
                      ? 'border-primary-600 bg-primary-50' 
                      : 'border-gray-300 hover:border-primary-300'
                  }`}>
                    <input
                      type="radio"
                      name="rentalType"
                      value="hour"
                      checked={formData.rentalType === "hour"}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Thuê theo giờ
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Tính theo giờ, trong ngày hôm nay</p>
                      <p className="text-sm font-semibold text-primary-600 mt-1">
                        {selectedVehicle.pricePerHour?.toLocaleString("vi-VN")}đ/giờ
                      </p>
                    </div>
                  </label>
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.rentalType === 'day' 
                      ? 'border-primary-600 bg-primary-50' 
                      : 'border-gray-300 hover:border-primary-300'
                  }`}>
                    <input
                      type="radio"
                      name="rentalType"
                      value="day"
                      checked={formData.rentalType === "day"}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Thuê theo ngày
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Tính theo ngày (24 giờ)</p>
                      <p className="text-sm font-semibold text-primary-600 mt-1">
                        {selectedVehicle.pricePerDay?.toLocaleString("vi-VN")}đ/ngày
                      </p>
                    </div>
                  </label>
                </div>
              </div>

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
                      {station.name} - {typeof station.address === 'object' 
                        ? `${station.address.street}, ${station.address.district}, ${station.address.city}`
                        : station.address}
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
                      {station.name} - {typeof station.address === 'object' 
                        ? `${station.address.street}, ${station.address.district}, ${station.address.city}`
                        : station.address}
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
                {formData.rentalType === 'day' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Ngày</label>
                      <input
                        type="date"
                        name="pickupDate"
                        value={formData.pickupTime ? formData.pickupTime.split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value;
                          const time = formData.pickupTime ? formData.pickupTime.split('T')[1] : '09:00';
                          handleInputChange({ target: { name: 'pickupTime', value: `${date}T${time}` } });
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Giờ</label>
                      <input
                        type="time"
                        name="pickupTimeOnly"
                        value={formData.pickupTime ? formData.pickupTime.split('T')[1] : ''}
                        onChange={(e) => {
                          const time = e.target.value;
                          const date = formData.pickupTime ? formData.pickupTime.split('T')[0] : new Date().toISOString().split('T')[0];
                          handleInputChange({ target: { name: 'pickupTime', value: `${date}T${time}` } });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Giờ (Hôm nay - {new Date().toLocaleDateString('vi-VN')})</label>
                    <input
                      type="time"
                      name="pickupTimeOnly"
                      value={formData.pickupTime ? formData.pickupTime.split('T')[1] : ''}
                      onChange={(e) => {
                        const time = e.target.value;
                        const today = new Date().toISOString().split('T')[0];
                        handleInputChange({ target: { name: 'pickupTime', value: `${today}T${time}` } });
                        
                        // Auto-set return time for same day (must be after pickup)
                        const [pickupHour, pickupMin] = time.split(':').map(Number);
                        const suggestedHour = Math.min(23, pickupHour + 2); // Suggest 2 hours later
                        const suggestedTime = `${String(suggestedHour).padStart(2, '0')}:${String(pickupMin).padStart(2, '0')}`;
                        if (!formData.expectedReturnTime || new Date(`${today}T${formData.expectedReturnTime.split('T')[1]}`) <= new Date(`${today}T${time}`)) {
                          handleInputChange({ target: { name: 'expectedReturnTime', value: `${today}T${suggestedTime}` } });
                        }
                      }}
                      min={new Date().toTimeString().slice(0, 5)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-amber-600 mt-1">* Chỉ cho thuê trong ngày hôm nay</p>
                  </div>
                )}
              </div>

              {/* Expected Return Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Thời gian trả xe dự kiến
                </label>
                {formData.rentalType === 'day' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Ngày</label>
                      <input
                        type="date"
                        name="returnDate"
                        value={formData.expectedReturnTime ? formData.expectedReturnTime.split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value;
                          const time = formData.pickupTime ? formData.pickupTime.split('T')[1] : '18:00';
                          handleInputChange({ target: { name: 'expectedReturnTime', value: `${date}T${time}` } });
                        }}
                        min={formData.pickupTime ? formData.pickupTime.split('T')[0] : new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Giờ (Cùng giờ lấy xe)</label>
                      <input
                        type="time"
                        name="returnTimeOnly"
                        value={formData.pickupTime ? formData.pickupTime.split('T')[1] : ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                        title="Giờ trả xe sẽ giống giờ lấy xe (thuê theo ngày)"
                      />
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-blue-600">
                        💡 Thuê theo ngày: Trả xe cùng giờ với giờ lấy xe (ví dụ: lấy 4PM hôm nay → trả 4PM ngày mai = 1 ngày)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Giờ (Hôm nay - {new Date().toLocaleDateString('vi-VN')})</label>
                    <input
                      type="time"
                      name="returnTimeOnly"
                      value={formData.expectedReturnTime ? formData.expectedReturnTime.split('T')[1] : ''}
                      onChange={(e) => {
                        const time = e.target.value;
                        const today = new Date().toISOString().split('T')[0];
                        handleInputChange({ target: { name: 'expectedReturnTime', value: `${today}T${time}` } });
                      }}
                      min={formData.pickupTime ? formData.pickupTime.split('T')[1] : new Date().toTimeString().slice(0, 5)}
                      max="23:59"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-amber-600 mt-1">* Trả xe trong ngày hôm nay, sau giờ lấy xe</p>
                  </div>
                )}
              </div>

              {/* Price Estimation */}
              {estimatedPrice > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">
                      {formData.rentalType === 'day' ? 'Số ngày thuê:' : 'Thời gian thuê dự kiến:'}
                    </span>
                    <span className="font-semibold">
                      {(() => {
                        const pickup = new Date(formData.pickupTime);
                        const returnTime = new Date(formData.expectedReturnTime);
                        
                        if (formData.rentalType === 'day') {
                          const totalDays = Math.max(1, Math.ceil((returnTime - pickup) / (1000 * 60 * 60 * 24)));
                          return `${totalDays} ngày`;
                        } else {
                          const totalHours = Math.ceil((returnTime - pickup) / (1000 * 60 * 60));
                          
                          // Calculate peak hours
                          let peakHours = 0;
                          let currentTime = new Date(pickup);
                          for (let i = 0; i < totalHours; i++) {
                            const hour = currentTime.getHours();
                            if (hour >= 17 && hour < 19) peakHours++;
                            currentTime.setHours(currentTime.getHours() + 1);
                          }
                          
                          if (peakHours > 0) {
                            return `${totalHours} giờ (${peakHours} giờ cao điểm)`;
                          }
                          return `${totalHours} giờ`;
                        }
                      })()}
                    </span>
                  </div>
                  {formData.rentalType === 'hour' && (() => {
                    const pickup = new Date(formData.pickupTime);
                    const returnTime = new Date(formData.expectedReturnTime);
                    const totalHours = Math.ceil((returnTime - pickup) / (1000 * 60 * 60));
                    
                    let peakHours = 0;
                    let currentTime = new Date(pickup);
                    for (let i = 0; i < totalHours; i++) {
                      const hour = currentTime.getHours();
                      if (hour >= 17 && hour < 19) peakHours++;
                      currentTime.setHours(currentTime.getHours() + 1);
                    }
                    
                    if (peakHours > 0) {
                      return (
                        <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded">
                          <p className="text-xs text-orange-800 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Giờ cao điểm (5PM-7PM): +20% giá
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">Tổng tiền dự kiến:</span>
                    <span className="text-xl font-bold text-primary-600">
                      {estimatedPrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-green-200">
                    <span className="text-gray-700 font-medium">Tiền cọc:</span>
                    <span className="text-lg font-bold text-orange-600">
                      {depositAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    * Tiền cọc sẽ được hoàn lại sau khi trả xe
                  </p>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Phương thức thanh toán
                </label>
                <div className="space-y-3">
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === "cash"}
                      onChange={handleInputChange}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">💵 Tiền mặt</div>
                      <p className="text-sm text-gray-600">Thanh toán bằng tiền mặt tại điểm thuê</p>
                    </div>
                  </label>
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={formData.paymentMethod === "bank_transfer"}
                      onChange={handleInputChange}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">🏦 Chuyển khoản</div>
                      <p className="text-sm text-gray-600">Chuyển khoản ngân hàng trước khi lấy xe</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Document Verification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Hình thức xác thực giấy tờ
                </label>
                <div className="space-y-3">
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="documentVerification"
                      value="at_station"
                      checked={formData.documentVerification === "at_station"}
                      onChange={handleInputChange}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">📋 Kiểm tra tại điểm thuê</div>
                      <p className="text-sm text-gray-600">Mang giấy tờ gốc đến điểm thuê để kiểm tra</p>
                    </div>
                  </label>
                  
                  {user?.verificationStatus === "approved" && (
                    <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-green-50 border-green-300">
                      <input
                        type="radio"
                        name="documentVerification"
                        value="from_profile"
                        checked={formData.documentVerification === "from_profile"}
                        onChange={handleInputChange}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 flex items-center">
                          ✅ Sử dụng giấy tờ đã xác thực
                          <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Đã duyệt</span>
                        </div>
                        <p className="text-sm text-gray-600">Sử dụng giấy tờ đã được xác thực trong hồ sơ của bạn</p>
                      </div>
                    </label>
                  )}
                  
                  {(!user?.verificationStatus || user?.verificationStatus !== "approved") && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Tài khoản của bạn chưa được xác thực. Vui lòng mang giấy tờ gốc đến điểm thuê.
                      </p>
                    </div>
                  )}
                </div>
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
                onClick={handleBackToStep1}
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
                      {typeof selectedPickupStation?.address === 'object'
                        ? `${selectedPickupStation.address.street}, ${selectedPickupStation.address.district}, ${selectedPickupStation.address.city}`
                        : selectedPickupStation?.address}
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
                      {typeof selectedReturnStation?.address === 'object'
                        ? `${selectedReturnStation.address.street}, ${selectedReturnStation.address.district}, ${selectedReturnStation.address.city}`
                        : selectedReturnStation?.address}
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

            {/* Payment & Verification Info */}
            <div className="mb-6 pb-6 border-b">
              <h3 className="font-semibold text-gray-900 mb-3">
                Thanh toán & Xác thực
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Phương thức thanh toán</p>
                  <p className="font-medium text-gray-900">
                    {formData.paymentMethod === "cash" ? "💵 Tiền mặt" : "🏦 Chuyển khoản"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formData.paymentMethod === "cash" 
                      ? "Thanh toán tại điểm thuê" 
                      : "Chuyển khoản trước khi lấy xe"}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Xác thực giấy tờ</p>
                  <p className="font-medium text-gray-900">
                    {formData.documentVerification === "at_station" 
                      ? "📋 Kiểm tra tại điểm thuê" 
                      : "✅ Sử dụng giấy tờ đã xác thực"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formData.documentVerification === "at_station"
                      ? "Mang giấy tờ gốc khi đến"
                      : "Đã được duyệt trong hồ sơ"}
                  </p>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-gradient-to-r from-primary-50 to-green-50 rounded-lg p-6 mb-6 border border-primary-200">
              <h3 className="font-semibold text-gray-900 mb-4">Chi phí</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700">Giá thuê</span>
                <span className="font-medium">
                  {selectedVehicle?.pricePerHour?.toLocaleString("vi-VN")}đ/giờ
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
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
              <div className="border-t border-primary-200 pt-3 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    Tổng tiền dự kiến
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    {estimatedPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Tiền cọc (30%)</span>
                  <span className="text-xl font-bold text-orange-600">
                    {depositAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Tiền cọc sẽ được hoàn lại sau khi trả xe
                </p>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                * Giá cuối cùng sẽ được tính dựa trên thời gian thực tế sử dụng
              </p>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                Lưu ý quan trọng
              </h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-7">
                <li>• Vui lòng đến điểm lấy xe đúng giờ đã đặt</li>
                <li>• Mang theo CMND/CCCD và Giấy phép lái xe (nếu chọn kiểm tra tại điểm thuê)</li>
                <li>• Tiền cọc sẽ được hoàn trả sau khi trả xe và kiểm tra không có hư hỏng</li>
                <li>• Xe cần được trả lại với mức pin tương đương hoặc cao hơn khi lấy</li>
              </ul>
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
                disabled={submitting}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl transition-all"
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              {confirmAction === 'select' ? 'Xác nhận chọn xe' : 'Xác nhận quay lại'}
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              {confirmAction === 'select' 
                ? `Bạn có chắc chắn muốn đặt xe "${tempSelectedVehicle?.name}" không?`
                : 'Bạn có chắc chắn muốn quay lại? Các thông tin đã nhập sẽ được giữ lại.'}
            </p>

            {confirmAction === 'select' && tempSelectedVehicle && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    {tempSelectedVehicle.images?.[0] ? (
                      <img
                        src={tempSelectedVehicle.images[0]}
                        alt={tempSelectedVehicle.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Car className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{tempSelectedVehicle.name}</h4>
                    <p className="text-sm text-gray-600">
                      {tempSelectedVehicle.type} • {tempSelectedVehicle.model}
                    </p>
                    <p className="text-sm font-semibold text-primary-600 mt-1">
                      {tempSelectedVehicle.pricePerHour?.toLocaleString("vi-VN")}đ/giờ
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setTempSelectedVehicle(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmAction === 'select' ? confirmSelectVehicle : confirmBackToStep1}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookVehiclePage;
