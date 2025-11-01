const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const Payment = require("../models/Payment");

// @desc    Get station bookings for staff
// @route   GET /api/staff/bookings
// @access  Private/Staff
exports.getStationBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const staff = await User.findById(req.user.id);

    if (!staff.assignedStation) {
      return res
        .status(400)
        .json({ message: "Nhân viên chưa được phân công điểm thuê" });
    }

    const filter = { pickupStation: staff.assignedStation };
    if (status) {
      filter.status = { $in: status.split(",") };
    }

    const bookings = await Booking.find(filter)
      .populate("userId", "fullName email phone")
      .populate("vehicleId", "name model licensePlate images")
      .populate("pickupStation", "name address")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get booking by ID
// @route   GET /api/staff/bookings/:id
// @access  Private/Staff
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "fullName email phone driverLicense nationalId")
      .populate("vehicleId")
      .populate("pickupStation")
      .populate("returnStation");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify customer documents
// @route   PUT /api/staff/bookings/:id/verify
// @access  Private/Staff
exports.verifyCustomer = async (req, res) => {
  try {
    const { approved, notes } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    if (booking.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Booking không ở trạng thái chờ xác thực" });
    }

    booking.status = approved ? "confirmed" : "rejected";
    booking.verifiedBy = req.user.id;
    booking.verifiedAt = Date.now();
    if (notes) booking.verificationNotes = notes;

    await booking.save();

    res.json({
      success: true,
      data: booking,
      message: approved ? "Đã xác thực khách hàng" : "Đã từ chối booking",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lấy danh sách renter đang chờ xác minh giấy tờ
// @route   GET /api/staff/verifications/pending
// @access  Private/Staff
exports.getPendingVerifications = async (req, res) => {
  try {
    const users = await User.find({ verificationStatus: "pending" }).select(
      "fullName email phone driverLicense nationalId verificationStatus"
    );
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Nhân viên xác minh hoặc từ chối hồ sơ renter
// @route   PATCH /api/staff/verifications/:userId
// @access  Private/Staff
exports.verifyUserDocuments = async (req, res) => {
  try {
    const { approved, note } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (user.role !== "renter") {
      return res
        .status(400)
        .json({ message: "Chỉ có thể xác minh hồ sơ người thuê" });
    }

    // ✅ Bắt buộc nhập note khi từ chối
    if (!approved && (!note || note.trim() === "")) {
      return res.status(400).json({
        message: "Vui lòng nhập lý do từ chối hồ sơ.",
      });
    }

    user.driverLicense.verified = approved;
    user.nationalId.verified = approved;
    user.verificationStatus = approved ? "approved" : "rejected";
    user.verificationNote = note || "";
    user.isVerified = approved;

    await user.save();

    res.json({
      success: true,
      message: approved
        ? "✅ Đã phê duyệt hồ sơ người thuê"
        : "❌ Đã từ chối hồ sơ người thuê",
      data: user,
    });
  } catch (error) {
    console.error("verifyUserDocuments error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lấy danh sách renter đã được phê duyệt
// @route   GET /api/staff/verifications/approved
// @access  Private/Staff
exports.getApprovedVerifications = async (req, res) => {
  try {
    const users = await User.find({ verificationStatus: "approved" }).select(
      "fullName email phone driverLicense nationalId verificationStatus verificationNote updatedAt"
    );

    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error("getApprovedVerifications error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lấy danh sách renter bị từ chối + lý do
// @route   GET /api/staff/verifications/rejected
// @access  Private/Staff
exports.getRejectedVerifications = async (req, res) => {
  try {
    const users = await User.find({ verificationStatus: "rejected" }).select(
      "fullName email phone driverLicense nationalId verificationStatus verificationNote updatedAt"
    );

    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error("getRejectedVerifications error:", error);
    res.status(500).json({ message: error.message });
  }
};



// @desc    Handover vehicle to customer
// @route   PUT /api/staff/bookings/:id/handover
// @access  Private/Staff
exports.handoverVehicle = async (req, res) => {
  try {
    const {
      batteryLevelBefore,
      odometerBefore,
      handoverNotes,
      handoverPhotos,
      digitalSignature,
    } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Booking chưa được xác thực" });
    }

    // Update booking
    booking.status = "picked-up";
    booking.batteryLevelBefore = batteryLevelBefore;
    booking.odometerBefore = odometerBefore;
    booking.handoverNotes = handoverNotes;
    booking.handoverPhotos = handoverPhotos;
    booking.digitalSignature = digitalSignature;
    booking.actualPickupTime = Date.now();

    await booking.save();

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(booking.vehicleId, {
      status: "rented",
      currentBatteryLevel: batteryLevelBefore,
      odometer: odometerBefore,
    });

    res.json({
      success: true,
      data: booking,
      message: "Đã bàn giao xe thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Return vehicle from customer
// @route   PUT /api/staff/bookings/:id/return
// @access  Private/Staff
exports.returnVehicle = async (req, res) => {
  try {
    const {
      batteryLevelAfter,
      odometerAfter,
      returnNotes,
      returnPhotos,
      damageCharges,
    } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    if (booking.status !== "picked-up") {
      return res.status(400).json({ message: "Xe chưa được bàn giao" });
    }

    // Calculate late fees
    const now = new Date();
    const expectedReturn = new Date(booking.endDate);
    let lateFees = 0;

    if (now > expectedReturn) {
      const lateHours = Math.ceil((now - expectedReturn) / (1000 * 60 * 60));
      const vehicle = await Vehicle.findById(booking.vehicleId);
      lateFees = lateHours * vehicle.pricePerHour * 1.5; // 1.5x for late fees
    }

    // Update booking
    booking.status = "completed";
    booking.batteryLevelAfter = batteryLevelAfter;
    booking.odometerAfter = odometerAfter;
    booking.returnNotes = returnNotes;
    booking.returnPhotos = returnPhotos;
    booking.actualReturnTime = Date.now();
    booking.lateFees = lateFees;
    booking.damageCharges = damageCharges || 0;

    await booking.save();

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(booking.vehicleId, {
      status: "available",
      currentBatteryLevel: batteryLevelAfter,
      odometer: odometerAfter,
    });

    res.json({
      success: true,
      data: booking,
      message: "Đã nhận xe trả về thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get vehicles at staff's station
// @route   GET /api/staff/vehicles
// @access  Private/Staff
exports.getStationVehicles = async (req, res) => {
  try {
    const { status } = req.query;
    const staff = await User.findById(req.user.id);

    if (!staff.assignedStation) {
      return res
        .status(400)
        .json({ message: "Nhân viên chưa được phân công điểm thuê" });
    }

    const filter = { currentStation: staff.assignedStation };
    if (status) {
      filter.status = { $in: status.split(",") };
    }

    const vehicles = await Vehicle.find(filter)
      .populate("currentStation", "name address")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update vehicle battery level
// @route   PUT /api/staff/vehicles/:id/battery
// @access  Private/Staff
exports.updateVehicleBattery = async (req, res) => {
  try {
    const { batteryLevel } = req.body;

    if (batteryLevel < 0 || batteryLevel > 100) {
      return res.status(400).json({ message: "Mức pin không hợp lệ" });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { currentBatteryLevel: batteryLevel },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Không tìm thấy xe" });
    }

    res.json({
      success: true,
      data: vehicle,
      message: "Đã cập nhật mức pin",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Report vehicle issue
// @route   POST /api/staff/vehicles/:id/issue
// @access  Private/Staff
exports.reportVehicleIssue = async (req, res) => {
  try {
    const { description, severity } = req.body;

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Không tìm thấy xe" });
    }

    vehicle.currentIssues.push({
      description,
      severity: severity || "medium",
      reportedBy: req.user.id,
      reportedAt: Date.now(),
    });

    // If high severity, mark as maintenance
    if (severity === "high") {
      vehicle.status = "maintenance";
    }

    await vehicle.save();

    res.json({
      success: true,
      data: vehicle,
      message: "Đã báo cáo sự cố",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update vehicle status
// @route   PUT /api/staff/vehicles/:id/status
// @access  Private/Staff
exports.updateVehicleStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "available",
      "rented",
      "maintenance",
      "charging",
      "unavailable",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Không tìm thấy xe" });
    }

    res.json({
      success: true,
      data: vehicle,
      message: "Đã cập nhật trạng thái xe",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payment summary for booking
// @route   GET /api/staff/bookings/:id/payment
// @access  Private/Staff
exports.getPaymentSummary = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("vehicleId", "pricePerHour pricePerDay deposit")
      .populate("userId", "fullName email phone");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    // Calculate rental amount
    const hours = Math.ceil(
      (new Date(booking.endDate) - new Date(booking.startDate)) /
        (1000 * 60 * 60)
    );
    const days = Math.ceil(hours / 24);

    const rentalAmount =
      booking.rentalType === "hourly"
        ? hours * booking.vehicleId.pricePerHour
        : days * booking.vehicleId.pricePerDay;

    const summary = {
      booking,
      rentalAmount,
      deposit: booking.vehicleId.deposit,
      lateFees: booking.lateFees || 0,
      damageCharges: booking.damageCharges || 0,
      totalAmount:
        rentalAmount + (booking.lateFees || 0) + (booking.damageCharges || 0),
      depositRefund: booking.vehicleId.deposit - (booking.damageCharges || 0),
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process payment
// @route   POST /api/staff/payments
// @access  Private/Staff
exports.processPayment = async (req, res) => {
  try {
    const { bookingId, paymentMethod, notes } = req.body;

    const booking = await Booking.findById(bookingId).populate("vehicleId");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Booking chưa hoàn thành" });
    }

    // Calculate amounts
    const hours = Math.ceil(
      (new Date(booking.endDate) - new Date(booking.startDate)) /
        (1000 * 60 * 60)
    );
    const days = Math.ceil(hours / 24);

    const rentalAmount =
      booking.rentalType === "hourly"
        ? hours * booking.vehicleId.pricePerHour
        : days * booking.vehicleId.pricePerDay;

    const totalAmount =
      rentalAmount + (booking.lateFees || 0) + (booking.damageCharges || 0);

    // Create payment
    const payment = await Payment.create({
      bookingId,
      userId: booking.userId,
      amount: totalAmount,
      paymentMethod: paymentMethod || "cash",
      paymentType: "rental",
      paymentStatus: "completed",
      processedBy: req.user.id,
      notes,
    });

    // Update booking
    booking.paymentStatus = "paid";
    await booking.save();

    res.json({
      success: true,
      data: payment,
      message: "Đã xử lý thanh toán thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get staff dashboard stats
// @route   GET /api/staff/stats
// @access  Private/Staff
exports.getStaffStats = async (req, res) => {
  try {
    const staff = await User.findById(req.user.id);

    if (!staff.assignedStation) {
      return res
        .status(400)
        .json({ message: "Nhân viên chưa được phân công điểm thuê" });
    }

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingBookings = await Booking.countDocuments({
      pickupStation: staff.assignedStation,
      status: "pending",
    });

    const activeRentals = await Booking.countDocuments({
      pickupStation: staff.assignedStation,
      status: "picked-up",
    });

    const todayPickups = await Booking.countDocuments({
      pickupStation: staff.assignedStation,
      startDate: { $gte: today },
      status: { $in: ["confirmed", "picked-up"] },
    });

    const todayReturns = await Booking.countDocuments({
      returnStation: staff.assignedStation,
      endDate: { $lte: new Date() },
      status: "picked-up",
    });

    const stationVehicles = await Vehicle.countDocuments({
      currentStation: staff.assignedStation,
    });

    const availableVehicles = await Vehicle.countDocuments({
      currentStation: staff.assignedStation,
      status: "available",
    });

    res.json({
      success: true,
      data: {
        pendingBookings,
        activeRentals,
        todayPickups,
        todayReturns,
        stationVehicles,
        availableVehicles,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
