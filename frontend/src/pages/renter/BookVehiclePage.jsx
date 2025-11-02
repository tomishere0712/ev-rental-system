import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { vehicleService, stationService, bookingService, paymentService } from "../../services";
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
  Search,
  Filter,
  DollarSign,
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

  // Filter state for Step 1
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    minPrice: "",
    maxPrice: "",
    minBattery: "",
    station: "",
  });

  const vehicleTypes = ["scooter", "motorcycle", "car", "bike"];

  const [formData, setFormData] = useState({
    vehicleId: vehicleIdFromUrl || "",
    pickupStationId: "",
    pickupDate: "", // Ngày lấy xe
    pickupTime: "", // Giờ lấy xe
    rentalType: "hour", // "hour" or "day"
    rentalDuration: 1, // Số giờ hoặc số ngày
    paymentMethod: "online", // online payment only
    documentVerification: "", // at_station or from_profile
    notes: "",
  });

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedPickupStation, setSelectedPickupStation] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);

  // Set default pickup date and time to now + 30 minutes
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Add 30 minutes
    
    // Get local date in YYYY-MM-DD format
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`; // HH:mm
    
    setFormData((prev) => ({
      ...prev,
      pickupDate: dateStr,
      pickupTime: timeStr,
    }));
  }, []);

  // Update pickup time when rental type changes to "hour"
  useEffect(() => {
    if (formData.rentalType === 'hour') {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30); // Add 30 minutes
      
      // Get local date in YYYY-MM-DD format
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      
      setFormData((prev) => ({
        ...prev,
        pickupDate: dateStr,
        pickupTime: timeStr,
      }));
    }
  }, [formData.rentalType]);

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

  // Auto-set pickup station when vehicle is selected
  useEffect(() => {
    if (selectedVehicle && selectedVehicle.currentStation) {
      const stationId = typeof selectedVehicle.currentStation === 'object' 
        ? selectedVehicle.currentStation._id 
        : selectedVehicle.currentStation;
      
      setFormData((prev) => ({ 
        ...prev, 
        pickupStationId: stationId 
      }));
      
      // Find and set the station object
      const station = stations.find((s) => s._id === stationId);
      if (station) {
        setSelectedPickupStation(station);
      }
    }
  }, [selectedVehicle, stations]);

  useEffect(() => {
    calculateEstimatedPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.rentalDuration, formData.rentalType, selectedVehicle]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      console.log("Fetching vehicles with filters:", filters);
      
      // Build params with filters
      const params = {
        status: "available",
        limit: 100,
      };

      if (filters.search) params.search = filters.search;
      if (filters.type) params.type = filters.type;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.minBattery) params.minBattery = filters.minBattery;
      if (filters.station) params.station = filters.station;

      const response = await vehicleService.getVehicles(params);
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

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "",
      minPrice: "",
      maxPrice: "",
      minBattery: "",
      station: "",
    });
    fetchVehicles();
  };

  const applyFilters = () => {
    fetchVehicles();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchVehicles();
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

    // Auto-select station object
    if (name === "pickupStationId") {
      const station = stations.find((s) => s._id === value);
      setSelectedPickupStation(station);
    }
  };

  const calculateEstimatedPrice = () => {
    if (!formData.rentalDuration || !selectedVehicle) {
      setEstimatedPrice(0);
      setDepositAmount(0);
      return;
    }

    const duration = parseInt(formData.rentalDuration) || 1;

    if (formData.rentalType === "day") {
      // Rental by day
      const price = duration * (selectedVehicle.pricePerDay || 0);
      const deposit = selectedVehicle.deposit || 0;
      
      setEstimatedPrice(price);
      setDepositAmount(deposit);
    } else {
      // Rental by hour
      const price = duration * (selectedVehicle.pricePerHour || 0);
      const deposit = selectedVehicle.deposit || 0;
      
      setEstimatedPrice(price);
      setDepositAmount(deposit);
    }
  };

  // Get minimum pickup time (30 minutes from now)
  const getMinimumPickupTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
  };

  const validateStep2 = () => {
    if (!formData.pickupStationId) {
      toast.error("Vui lòng chọn điểm lấy và trả xe");
      return false;
    }
    if (!formData.pickupDate) {
      toast.error("Vui lòng chọn ngày lấy xe");
      return false;
    }
    if (!formData.pickupTime) {
      toast.error("Vui lòng chọn giờ lấy xe");
      return false;
    }
    if (!formData.rentalDuration || formData.rentalDuration < 1) {
      toast.error(`Vui lòng chọn số ${formData.rentalType === 'day' ? 'ngày' : 'giờ'} thuê`);
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

    // Validate pickup time is at least 30 minutes from now
    const pickupDateTime = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
    const now = new Date();
    const minPickupTime = new Date(now.getTime() + 30 * 60 * 1000);

    if (pickupDateTime < minPickupTime) {
      toast.error("Thời gian lấy xe phải sau ít nhất 30 phút kể từ bây giờ");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Calculate start and end date/time
      const pickupDateTime = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
      const duration = parseInt(formData.rentalDuration) || 1;
      
      let endDateTime;
      if (formData.rentalType === 'day') {
        // Add days
        endDateTime = new Date(pickupDateTime);
        endDateTime.setDate(endDateTime.getDate() + duration);
      } else {
        // Add hours
        endDateTime = new Date(pickupDateTime);
        endDateTime.setHours(endDateTime.getHours() + duration);
      }
      
      const bookingData = {
        vehicle: formData.vehicleId,
        station: formData.pickupStationId, // Main station reference
        pickupStation: formData.pickupStationId,
        returnStation: formData.pickupStationId, // Same as pickup (lấy và trả cùng chỗ)
        startDate: pickupDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        pricing: {
          basePrice: estimatedPrice,
          totalAmount: estimatedPrice + depositAmount,
          deposit: depositAmount
        },
        notes: formData.notes || ""
      };

      console.log("Booking data being sent:", bookingData);
      
      const response = await bookingService.create(bookingData);
      console.log("Booking response:", response);
      
      // Backend returns response.data directly
      const bookingId = response.data?._id || response.data?.data?._id;
      
      if (!bookingId) {
        throw new Error("Không nhận được booking ID từ server");
      }

      toast.success("Tạo đơn thuê thành công! Chuyển đến thanh toán...", {
        duration: 2000,
      });

      // Create VNPay payment URL and redirect
      try {
        const paymentResponse = await paymentService.createVNPayUrl(bookingId);
        console.log("VNPay URL response:", paymentResponse);
        
        if (paymentResponse.success && paymentResponse.data?.paymentUrl) {
          // Redirect to VNPay payment page
          window.location.href = paymentResponse.data.paymentUrl;
        } else {
          throw new Error("Không nhận được link thanh toán VNPay");
        }
      } catch (paymentError) {
        console.error("VNPay URL error:", paymentError);
        toast.error("Không thể tạo link thanh toán. Vui lòng thử lại!");
        // Still navigate to booking detail if payment link fails
        navigate(`/renter/bookings/${bookingId}`);
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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Bộ lọc
                </h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Xóa
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tên xe, model..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại xe
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Tất cả</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá thuê (VNĐ/giờ)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Từ"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Đến"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Battery */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Battery className="w-4 h-4 inline mr-1" />
                  Pin tối thiểu (%)
                </label>
                <input
                  type="number"
                  value={filters.minBattery}
                  onChange={(e) => handleFilterChange("minBattery", e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="0-100"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Station */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Điểm thuê
                </label>
                <select
                  value={filters.station}
                  onChange={(e) => handleFilterChange("station", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Tất cả điểm thuê</option>
                  {stations.map((station) => (
                    <option key={station._id} value={station._id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={applyFilters}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </aside>

          {/* Vehicle Grid */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Chọn xe bạn muốn thuê
              </h2>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
                    >
                      <div className="h-48 bg-gray-300"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : vehicles.length === 0 ? (
                <div className="text-center py-12">
                  <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Không tìm thấy xe
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Thử thay đổi bộ lọc hoặc tìm kiếm khác
                  </p>
                  <button
                    onClick={clearFilters}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-gray-600">
                    Tìm thấy {vehicles.length} xe
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {vehicles.map((vehicle) => (
                      <button
                        key={vehicle._id}
                        onClick={() => handleSelectVehicle(vehicle)}
                        className={`text-left border-2 rounded-lg overflow-hidden transition-all ${
                          selectedVehicle?._id === vehicle._id
                            ? "border-primary-600 shadow-lg"
                            : "border-gray-200 hover:border-primary-300 hover:shadow-md"
                        }`}
                      >
                        {/* Vehicle Image */}
                        <div className="relative h-48 bg-gray-200">
                          {vehicle.images?.[0] ? (
                            <img
                              src={vehicle.images[0]}
                              alt={vehicle.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="w-16 h-16 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Selected Badge */}
                          {selectedVehicle?._id === vehicle._id && (
                            <div className="absolute top-2 left-2">
                              <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Đã chọn
                              </span>
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="absolute top-2 right-2">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                              Sẵn sàng
                            </span>
                          </div>
                        </div>

                        {/* Vehicle Details */}
                        <div className="p-4">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {vehicle.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {vehicle.type} • {vehicle.model}
                          </p>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Battery className="w-4 h-4 mr-2 text-primary-600" />
                              <span>
                                Pin: {vehicle.currentBatteryLevel}% • {vehicle.range}km
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="w-4 h-4 mr-2 text-primary-600" />
                              <span>
                                {vehicle.currentStation?.name || "Đang cập nhật"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div>
                              <div className="text-2xl font-bold text-primary-600">
                                {vehicle.pricePerHour?.toLocaleString("vi-VN")}đ
                              </div>
                              <div className="text-xs text-gray-500">/ giờ</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-700">
                                {vehicle.pricePerDay?.toLocaleString("vi-VN")}đ
                              </div>
                              <div className="text-xs text-gray-500">/ ngày</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>
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

              {/* Pickup/Return Station - Same location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Điểm lấy và trả xe
                </label>
                <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  {selectedVehicle && selectedPickupStation ? (
                    <div>
                      <p className="font-medium text-gray-900">{selectedPickupStation.name}</p>
                      <p className="text-sm text-gray-600">
                        {typeof selectedPickupStation.address === 'object' 
                          ? `${selectedPickupStation.address.street}, ${selectedPickupStation.address.district}, ${selectedPickupStation.address.city}`
                          : selectedPickupStation.address}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Đang tải...</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Lấy và trả xe tại cùng một điểm (vị trí hiện tại của xe)
                </p>
              </div>

              {/* Pickup Date and Time - 2 columns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Ngày lấy xe
                  </label>
                  <input
                    type="date"
                    name="pickupDate"
                    value={formData.pickupDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Giờ lấy xe
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        name="pickupHour"
                        placeholder="Giờ"
                        value={formData.pickupTime ? formData.pickupTime.split(':')[0] : ''}
                        onChange={(e) => {
                          const hour = e.target.value;
                          const minute = formData.pickupTime ? formData.pickupTime.split(':')[1] : '00';
                          handleInputChange({
                            target: {
                              name: 'pickupTime',
                              value: hour && minute ? `${String(hour).padStart(2, '0')}:${minute}` : ''
                            }
                          });
                        }}
                        min="1"
                        max="24"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <span className="flex items-center text-gray-500">:</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        name="pickupMinute"
                        placeholder="Phút"
                        value={formData.pickupTime ? formData.pickupTime.split(':')[1] : ''}
                        onChange={(e) => {
                          const minute = e.target.value;
                          const hour = formData.pickupTime ? formData.pickupTime.split(':')[0] : '';
                          handleInputChange({
                            target: {
                              name: 'pickupTime',
                              value: hour && minute !== '' ? `${hour}:${String(minute).padStart(2, '0')}` : ''
                            }
                          });
                        }}
                        min="0"
                        max="59"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Giờ: 1-24, Phút: 0-59</p>
                </div>
              </div>
              <p className="text-xs text-amber-600 -mt-2">
                * Thời gian lấy xe phải sau ít nhất 30 phút kể từ bây giờ
              </p>

              {/* Rental Duration - Show hours or days based on rental type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formData.rentalType === 'day' ? 'Số ngày thuê' : 'Số giờ thuê'}
                </label>
                <input
                  type="number"
                  name="rentalDuration"
                  value={formData.rentalDuration}
                  onChange={handleInputChange}
                  min="1"
                  max={formData.rentalType === 'day' ? '30' : '24'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.rentalType === 'day' 
                    ? 'Tối đa 30 ngày' 
                    : 'Tối đa 24 giờ. Nếu thuê trên 24 giờ, vui lòng chọn thuê theo ngày'}
                </p>
              </div>

              {/* Price Estimation */}
              {estimatedPrice > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">
                      {formData.rentalType === 'day' ? 'Số ngày thuê:' : 'Số giờ thuê:'}
                    </span>
                    <span className="font-semibold">
                      {formData.rentalDuration} {formData.rentalType === 'day' ? 'ngày' : 'giờ'}
                    </span>
                  </div>
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
                <div className="p-4 border-2 border-primary-300 rounded-lg bg-primary-50">
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={true}
                      readOnly
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">� Thanh toán trực tuyến</div>
                      <p className="text-sm text-gray-600">Thanh toán qua PayOS - An toàn & Nhanh chóng</p>
                      <p className="text-xs text-primary-600 mt-1">
                        ✓ Hỗ trợ QR Code, ví điện tử, thẻ ATM
                      </p>
                    </div>
                  </div>
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
                    <p className="text-sm text-gray-600">Điểm lấy và trả xe</p>
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
                  <Calendar className="w-5 h-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Ngày và giờ lấy xe</p>
                    <p className="font-medium text-gray-900">
                      {formData.pickupDate && formData.pickupTime 
                        ? new Date(`${formData.pickupDate}T${formData.pickupTime}`).toLocaleString("vi-VN")
                        : 'Chưa chọn'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Thời gian thuê</p>
                    <p className="font-medium text-gray-900">
                      {formData.rentalDuration} {formData.rentalType === 'day' ? 'ngày' : 'giờ'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Thời gian trả xe dự kiến</p>
                    <p className="font-medium text-gray-900">
                      {(() => {
                        if (!formData.pickupDate || !formData.pickupTime) return 'Chưa tính';
                        const pickupDateTime = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
                        const duration = parseInt(formData.rentalDuration) || 1;
                        let endDateTime;
                        if (formData.rentalType === 'day') {
                          endDateTime = new Date(pickupDateTime);
                          endDateTime.setDate(endDateTime.getDate() + duration);
                        } else {
                          endDateTime = new Date(pickupDateTime);
                          endDateTime.setHours(endDateTime.getHours() + duration);
                        }
                        return endDateTime.toLocaleString("vi-VN");
                      })()}
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
                    💳 Thanh toán trực tuyến (VNPay)
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Thanh toán qua VNPay - An toàn & Nhanh chóng
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
                  {formData.rentalType === 'day' 
                    ? `${selectedVehicle?.pricePerDay?.toLocaleString("vi-VN")}đ/ngày`
                    : `${selectedVehicle?.pricePerHour?.toLocaleString("vi-VN")}đ/giờ`}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700">Thời gian thuê</span>
                <span className="font-medium">
                  {formData.rentalDuration} {formData.rentalType === 'day' ? 'ngày' : 'giờ'}
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
                  <span className="font-semibold text-gray-900">Tiền cọc</span>
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
              
              {/* Nút xem chi tiết xe */}
              {confirmAction === 'select' && tempSelectedVehicle && (
                <button
                  onClick={() => {
                    // Navigate đến trang chi tiết xe (không mở tab mới)
                    navigate(`/vehicles/${tempSelectedVehicle._id}`);
                  }}
                  className="flex-1 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-medium transition-colors"
                >
                  Xem chi tiết
                </button>
              )}
              
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
