import { useState, useEffect } from "react";
import { staffService } from "../../services";
import {
  Search,
  Upload,
  Car,
  User,
  Calendar,
  Battery,
  AlertCircle,
  CheckCircle,
  DollarSign,
} from "lucide-react";

const VehicleHandoverPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState([]); // Danh sách bookings
  const [selectedBooking, setSelectedBooking] = useState(null); // Booking được chọn
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [handoverType, setHandoverType] = useState("pickup"); // pickup or return
  const [processing, setProcessing] = useState(false);

  // Pickup form state
  const [pickupPhotos, setPickupPhotos] = useState([]);
  const [pickupBattery, setPickupBattery] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");

  // Return form state
  const [returnPhotos, setReturnPhotos] = useState([]);
  const [returnBattery, setReturnBattery] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [lateFees, setLateFees] = useState(0);

  // Load all confirmed/in-progress bookings on mount
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log("📡 Đang tải danh sách booking...");
      const response = await staffService.getBookings({ 
        status: "confirmed,in-progress,pending_return,refund_pending" 
      });
      
      const bookingsList = response.data || response || [];
      console.log("✅ Đã tải", bookingsList.length, "booking(s)");
      setBookings(bookingsList);
      setError("");
    } catch (err) {
      console.error("💥 Lỗi tải booking:", err);
      setError("Không thể tải danh sách booking");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchBookings(); // Reset về danh sách đầy đủ
      return;
    }

    // Auto-add "BK" prefix if user only enters numbers
    let query = searchQuery.trim();
    if (/^\d+$/.test(query) && !query.startsWith("BK")) {
      query = "BK" + query;
      console.log("🔧 Tự động thêm 'BK' prefix:", query);
    }

    console.log("🔍 Bắt đầu tìm kiếm:", query);

    setLoading(true);
    setError("");

    try {
      const response = await staffService.getBookings({ search: query });
      const searchResults = response.data || response || [];
      console.log("✅ Tìm thấy", searchResults.length, "booking(s)");
      
      // Filter only processable bookings
      const processableBookings = searchResults.filter(
        (b) =>
          b.status === "confirmed" ||
          b.status === "in-progress" ||
          b.status === "pending_return"
      );

      setBookings(processableBookings);
      
      if (processableBookings.length === 0) {
        setError(`Không tìm thấy booking với trạng thái có thể xử lý. Tìm thấy ${searchResults.length} booking nhưng không ở trạng thái 'confirmed', 'in-progress' hoặc 'pending_return'.`);
      }
    } catch (err) {
      console.error("💥 Lỗi tìm kiếm:", err);
      setError(err.response?.data?.message || "Không thể tìm kiếm booking");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBooking = (booking) => {
    console.log("📌 Chọn booking:", booking.bookingNumber);
    setSelectedBooking(booking);

    // Determine handover type based on booking status
    if (booking.status === "confirmed") {
      console.log("🚗 Loại: GIAO XE");
      setHandoverType("pickup");
    } else if (booking.status === "pending_return") {
      console.log("🔙 Loại: TRẢ XE");
      setHandoverType("return");
      
      // Calculate late fees if overdue (chỉ để tham khảo, nhân viên có thể nhập thủ công)
      const endDate = new Date(booking.endDate);
      const today = new Date();
      if (today > endDate) {
        const daysLate = Math.ceil(
          (today - endDate) / (1000 * 60 * 60 * 24)
        );
        const dailyRate = booking.vehicle?.pricePerDay || 0;
        const calculatedLateFees = daysLate * dailyRate * 0.5;
        console.log("⚠️ Trả xe trễ:", daysLate, "ngày, phí đề xuất:", calculatedLateFees);
        setLateFees(calculatedLateFees);
      } else {
        setLateFees(0);
      }
    } else if (booking.status === "in-progress") {
      alert("⚠️ Khách hàng chưa gửi yêu cầu trả xe. Vui lòng đợi khách hàng gửi yêu cầu trả xe trước khi xử lý.");
    }
  };

  const handlePhotoUpload = (e, type) => {
    const files = Array.from(e.target.files);
    const photoUrls = files.map((file) => URL.createObjectURL(file));

    if (type === "pickup") {
      setPickupPhotos([...pickupPhotos, ...photoUrls]);
    } else {
      setReturnPhotos([...returnPhotos, ...photoUrls]);
    }
  };

  const handlePickup = async () => {
    console.log("🚗 Bắt đầu giao xe...");
    console.log("📋 selectedBooking:", selectedBooking);
    console.log("🔋 pickupBattery:", pickupBattery);
    console.log("📸 pickupPhotos:", pickupPhotos);

    if (!selectedBooking || !pickupBattery) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (!selectedBooking._id) {
      console.error("❌ Booking không có _id:", selectedBooking);
      alert("Lỗi: Không tìm thấy ID booking");
      return;
    }

    setProcessing(true);
    try {
      const handoverData = {
        pickupPhotos: pickupPhotos || [],
        pickupBatteryLevel: parseFloat(pickupBattery),
        pickupNotes: pickupNotes || "",
        signature: "digital_signature_data",
      };
      console.log("📤 Dữ liệu gửi:", handoverData);

      await staffService.handoverVehicle(selectedBooking._id, handoverData);
      console.log("✅ Giao xe thành công");

      alert("Giao xe thành công!");
      resetForm();
      fetchBookings(); // Refresh danh sách
    } catch (error) {
      console.error("💥 Lỗi giao xe:", error);
      console.error("💥 Chi tiết lỗi:", error.response?.data);
      alert(error.response?.data?.message || "Không thể giao xe");
    } finally {
      setProcessing(false);
    }
  };

  const handleReturn = async () => {
    console.log("🔙 Bắt đầu nhận trả xe...");

    if (!selectedBooking || !returnBattery) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Check if additional payment is required
    const deposit = selectedBooking.pricing?.deposit || 0;
    const requiresAdditionalPayment = lateFees > deposit;
    
    // No need to check for transaction ID - will be handled via VNPAY payment flow
    if (requiresAdditionalPayment) {
      const additionalAmount = lateFees - deposit;
      const confirmed = window.confirm(
        `⚠️ CHI PHÍ PHÁT SINH VƯỢT TIỀN CỌC!\n\n` +
        `Chi phí phát sinh: ${lateFees.toLocaleString()}đ\n` +
        `Tiền cọc: ${deposit.toLocaleString()}đ\n` +
        `Cần thanh toán thêm: ${additionalAmount.toLocaleString()}đ\n\n` +
        `Hệ thống sẽ tạo yêu cầu thanh toán VNPAY cho khách hàng.\n` +
        `Khách hàng cần thanh toán trước khi hoàn tất trả xe.\n\n` +
        `Bạn có muốn tiếp tục?`
      );
      
      if (!confirmed) {
        return;
      }
    }

    setProcessing(true);
    try {
      const returnData = {
        returnPhotos: returnPhotos,
        returnBatteryLevel: parseFloat(returnBattery),
        returnNotes: returnNotes,
        lateFees: lateFees,
      };

      console.log("📤 Dữ liệu gửi:", returnData);
      await staffService.returnVehicle(selectedBooking._id, returnData);
      console.log("✅ Nhận trả xe thành công");

      if (requiresAdditionalPayment) {
        alert(
          "✅ Đã xác nhận trả xe!\n\n" +
          "📱 Khách hàng cần thanh toán chi phí phát sinh qua VNPAY.\n" +
          "Vui lòng thông báo khách hàng kiểm tra email và thanh toán."
        );
      } else {
        alert("✅ Nhận trả xe thành công!");
      }
      
      resetForm();
      fetchBookings(); // Refresh danh sách
    } catch (error) {
      console.error("💥 Lỗi nhận trả xe:", error);
      console.error("💥 Response data:", error.response?.data);
      console.error("💥 Response status:", error.response?.status);
      alert(error.response?.data?.message || "Không thể nhận trả xe");
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setSelectedBooking(null);
    setPickupPhotos([]);
    setPickupBattery("");
    setPickupNotes("");
    setReturnPhotos([]);
    setReturnBattery("");
    setReturnNotes("");
    setLateFees(0);
  };

  const getStatusBadge = (status, booking) => {
    const badges = {
      confirmed: { bg: "bg-blue-100", text: "text-blue-800", label: "Đã xác nhận" },
      "in-progress": { bg: "bg-green-100", text: "text-green-800", label: "Đang thuê" },
      pending_return: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Chờ trả xe" },
      refund_pending: (() => {
        // Check if customer paid additional charges
        if (booking?.additionalPayment?.status === "paid" || booking?.additionalPayment?.status === "completed") {
          return { bg: "bg-emerald-100", text: "text-emerald-800", label: "✅ Khách đã thanh toán" };
        }
        // Check if customer needs to pay additional
        if (booking?.additionalPayment?.status === "pending") {
          return { bg: "bg-orange-100", text: "text-orange-800", label: "⏳ Chờ khách thanh toán" };
        }
        // Normal refund case
        return { bg: "bg-purple-100", text: "text-purple-800", label: "Chờ hoàn cọc" };
      })(),
    };
    return badges[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Giao/Nhận Xe</h1>
        <p className="text-gray-600 mt-2">Quản lý giao xe và nhận trả xe</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập mã booking (VD: BK17621024931020008 hoặc chỉ số) hoặc email khách hàng..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {loading ? "Đang tìm..." : "Tìm kiếm"}
            </button>
          </div>
          <p className="text-sm text-gray-500">
            💡 Mẹo: Bạn có thể chỉ nhập số (VD: "17621024931020008") và hệ thống sẽ tự động thêm "BK"
          </p>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Bookings List */}
      {!selectedBooking && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Danh sách Booking ({bookings.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Không có booking nào cần xử lý</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mã Booking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Xe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ngày bắt đầu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((booking) => {
                    const statusBadge = getStatusBadge(booking.status, booking);
                    return (
                      <tr key={booking._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{booking.bookingNumber || booking._id.slice(-6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.renter?.fullName || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.renter?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {booking.vehicle?.images?.[0] && (
                              <img
                                src={booking.vehicle.images[0]}
                                alt=""
                                className="w-10 h-10 rounded object-cover mr-3"
                              />
                            )}
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {booking.vehicle?.name || "N/A"}
                              </div>
                              <div className="text-gray-500">
                                {booking.vehicle?.licensePlate}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(booking.startDate).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {booking.status === "confirmed" ? (
                            <button
                              onClick={() => handleSelectBooking(booking)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Giao xe
                            </button>
                          ) : booking.status === "pending_return" ? (
                            <button
                              onClick={() => handleSelectBooking(booking)}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Nhận trả xe
                            </button>
                          ) : booking.status === "in-progress" ? (
                            <span className="text-gray-400 text-xs">
                              Chờ khách yêu cầu trả xe
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Booking Details and Handover Form */}
      {selectedBooking && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-white hover:text-gray-200 flex items-center gap-2"
              >
                ← Quay lại
              </button>
              <h2 className="text-xl font-semibold text-white">
                {handoverType === "pickup"
                  ? "Giao Xe"
                  : "Nhận Trả Xe"}
              </h2>
            </div>
            <span
              className={`px-4 py-1 rounded-full text-sm font-semibold ${getStatusBadge(
                selectedBooking.status,
                selectedBooking
              ).bg} ${getStatusBadge(selectedBooking.status, selectedBooking).text}`}
            >
              {getStatusBadge(selectedBooking.status, selectedBooking).label}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer & Vehicle Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Khách hàng
                  </h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-600">Họ tên:</span>{" "}
                    <span className="font-medium">
                      {selectedBooking.renter?.fullName || "N/A"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Email:</span>{" "}
                    <span className="font-medium">{selectedBooking.renter?.email || "N/A"}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Điện thoại:</span>{" "}
                    <span className="font-medium">{selectedBooking.renter?.phone || "N/A"}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Mã booking:</span>{" "}
                    <span className="font-medium">
                      #{selectedBooking.bookingNumber || "N/A"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Xe
                  </h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-600">Tên xe:</span>{" "}
                    <span className="font-medium">
                      {selectedBooking.vehicle?.name || "N/A"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Biển số:</span>{" "}
                    <span className="font-medium">
                      {selectedBooking.vehicle?.licensePlate || "N/A"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Giá/Ngày:</span>{" "}
                    <span className="font-medium">
                      {selectedBooking.vehicle?.pricePerDay ? 
                        `${selectedBooking.vehicle.pricePerDay.toLocaleString()} VNĐ` : "N/A"}
                    </span>
                  </p>
                  {selectedBooking.vehicle?.images?.[0] && (
                    <img 
                      src={selectedBooking.vehicle.images[0]} 
                      alt="Vehicle" 
                      className="w-full h-32 object-cover rounded mt-2"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Booking Dates */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Thời gian thuê
                </h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg flex justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ngày bắt đầu</p>
                  <p className="text-base font-medium">
                    {new Date(selectedBooking.startDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày kết thúc</p>
                  <p className="text-base font-medium">
                    {new Date(selectedBooking.endDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>

            {/* Return Request Info - Show if status is pending_return */}
            {selectedBooking.status === "pending_return" && selectedBooking.returnRequest && (
              <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-purple-900 mb-1">
                      Yêu cầu trả xe từ khách hàng
                    </h4>
                    <p className="text-xs text-purple-700 mb-2">
                      Thời gian yêu cầu: {new Date(selectedBooking.returnRequest.requestedAt).toLocaleString("vi-VN")}
                    </p>
                    {selectedBooking.returnRequest.notes && (
                      <div className="bg-white p-3 rounded border border-purple-200">
                        <p className="text-xs text-gray-600 mb-1">Ghi chú từ khách hàng:</p>
                        <p className="text-sm text-gray-900">{selectedBooking.returnRequest.notes}</p>
                      </div>
                    )}
                    {selectedBooking.returnRequest.location && (
                      <p className="text-xs text-purple-600 mt-2">
                        📍 Địa điểm trả: {selectedBooking.returnRequest.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pickup or Return Form based on status */}
            {selectedBooking.status === "confirmed" && handoverType === "pickup" && (
              <>
                {/* Pickup Form */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Quy trình giao xe
                  </h3>

                  <div className="space-y-4">
                    {/* Battery Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Battery className="w-4 h-4 inline mr-1" />
                        Mức pin hiện tại (%) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pickupBattery}
                        onChange={(e) => setPickupBattery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Upload className="w-4 h-4 inline mr-1" />
                        Ảnh xe (Kiểm tra hư hỏng)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handlePhotoUpload(e, "pickup")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {pickupPhotos.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {pickupPhotos.map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={`Pickup ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded"
                            />
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
                        value={pickupNotes}
                        onChange={(e) => setPickupNotes(e.target.value)}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ghi chú về tình trạng xe..."
                      />
                    </div>

                    <button
                      onClick={handlePickup}
                      disabled={processing || !pickupBattery}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {processing ? "Đang xử lý..." : "Hoàn tất giao xe"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {selectedBooking.status === "pending_return" && handoverType === "return" && (
              <>
                {/* Return Form */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Quy trình nhận trả xe
                  </h3>

                  <div className="space-y-4">
                    {/* Battery Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Battery className="w-4 h-4 inline mr-1" />
                        Mức pin hiện tại (%) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={returnBattery}
                        onChange={(e) => setReturnBattery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Late Fees / Additional Charges */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Chi phí phát sinh (VNĐ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={lateFees}
                        onChange={(e) => setLateFees(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập phí trễ, phí sửa chữa, hoặc phí phát sinh khác..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Tiền cọc hiện tại: <span className="font-semibold">{(selectedBooking.pricing?.deposit || 0).toLocaleString()} VNĐ</span>
                      </p>
                      {lateFees > 0 && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ Chi phí phát sinh: <span className="font-bold">{lateFees.toLocaleString()} VNĐ</span>
                          </p>
                          {lateFees > (selectedBooking.pricing?.deposit || 0) && (
                            <p className="text-sm text-red-600 mt-1 font-semibold">
                              🚨 Chi phí vượt tiền cọc! Cần thanh toán thêm: {" "}
                              <span className="font-bold">
                                {(lateFees - (selectedBooking.pricing?.deposit || 0)).toLocaleString()} VNĐ
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Additional Payment Notice - Show only if late fees exceed deposit */}
                    {lateFees > (selectedBooking.pricing?.deposit || 0) && (
                      <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-orange-900 mb-2">
                              💳 Chi phí phát sinh vượt tiền cọc
                            </h4>
                            <p className="text-sm text-orange-800 mb-2">
                              Khách hàng cần thanh toán thêm:{" "}
                              <span className="font-bold text-lg text-red-600">
                                {(lateFees - (selectedBooking.pricing?.deposit || 0)).toLocaleString()}đ
                              </span>
                            </p>
                            <div className="bg-white rounded p-3 text-xs space-y-1">
                              <p className="text-gray-700">
                                ✅ <strong>Bước 1:</strong> Bạn xác nhận nhận trả xe (click nút bên dưới)
                              </p>
                              <p className="text-gray-700">
                                ✅ <strong>Bước 2:</strong> Hệ thống tạo yêu cầu thanh toán VNPAY cho khách hàng
                              </p>
                              <p className="text-gray-700">
                                ✅ <strong>Bước 3:</strong> Khách hàng thanh toán qua VNPAY trên app/trang booking
                              </p>
                              <p className="text-gray-700">
                                ✅ <strong>Bước 4:</strong> Sau khi thanh toán xong, booking chuyển sang chờ hoàn cọc
                              </p>
                            </div>
                            <p className="text-xs text-orange-700 mt-2 font-medium">
                              � Không cần nhập mã giao dịch thủ công. Khách hàng sẽ thanh toán online qua VNPAY.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Upload className="w-4 h-4 inline mr-1" />
                        Ảnh xe (Kiểm tra khi trả)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handlePhotoUpload(e, "return")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {returnPhotos.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {returnPhotos.map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={`Return ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ghi chú & Báo cáo hư hỏng
                      </label>
                      <textarea
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ghi chú hư hỏng hoặc vấn đề phát hiện..."
                      />
                    </div>

                    <button
                      onClick={handleReturn}
                      disabled={processing || !returnBattery}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {processing ? "Đang xử lý..." : "Hoàn tất nhận trả xe"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleHandoverPage;
