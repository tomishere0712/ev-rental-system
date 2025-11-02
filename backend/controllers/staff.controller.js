const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const Payment = require("../models/Payment");

// @desc    Get station bookings for staff
// @route   GET /api/staff/bookings
// @access  Private/Staff
exports.getStationBookings = async (req, res) => {
  try {
    const { status, search } = req.query;
    const staff = await User.findById(req.user.id);

    console.log("=== Staff Bookings Debug ===");
    console.log("Staff ID:", req.user.id);
    console.log("Staff assigned station:", staff.assignedStation);
    console.log("Query status:", status);
    console.log("Query search:", search);

    if (!staff.assignedStation) {
      return res
        .status(400)
        .json({ message: "Nhân viên chưa được phân công điểm thuê" });
    }

    const filter = { pickupStation: staff.assignedStation };

    // Add status filter
    if (status) {
      filter.status = { $in: status.split(",") };
    }

    // Add search filter (booking number or user email)
    if (search) {
      // First, find booking by booking number
      const bookingByNumber = await Booking.findOne({
        bookingNumber: search,
        pickupStation: staff.assignedStation,
      })
        .populate("renter", "fullName email phone")
        .populate("vehicle", "name model licensePlate images pricePerDay")
        .populate("pickupStation", "name address")
        .populate("returnStation", "name address");

      if (bookingByNumber) {
        console.log("Found booking by number:", bookingByNumber.bookingNumber);
        return res.json({
          success: true,
          data: [bookingByNumber],
        });
      }

      // If not found by booking number, search by user email
      const usersByEmail = await User.find({
        email: { $regex: search, $options: "i" },
      }).select("_id");

      if (usersByEmail.length > 0) {
        filter.renter = { $in: usersByEmail.map((u) => u._id) };
      } else {
        // No user found with this email
        return res.json({
          success: true,
          data: [],
        });
      }
    }

    console.log("Filter:", JSON.stringify(filter));

    const bookings = await Booking.find(filter)
      .populate("renter", "fullName email phone")
      .populate("vehicle", "name model licensePlate images pricePerDay")
      .populate("pickupStation", "name address")
      .populate("returnStation", "name address")
      .sort({ createdAt: -1 })
      .limit(100);

    console.log("Found bookings count:", bookings.length);
    if (bookings.length > 0) {
      console.log("First booking:", {
        id: bookings[0]._id,
        bookingNumber: bookings[0].bookingNumber,
        status: bookings[0].status,
        renter: bookings[0].renter?.fullName,
        vehicle: bookings[0].vehicle?.name,
      });
    }

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Error in getStationBookings:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ALL bookings (DEBUG - no station filter)
// @route   GET /api/staff/bookings/all
// @access  Private/Staff
exports.getAllBookingsDebug = async (req, res) => {
  try {
    console.log("=== Fetching ALL bookings for debug ===");

    const bookings = await Booking.find()
      .populate("renter", "fullName email phone")
      .populate("vehicle", "name model licensePlate")
      .populate("pickupStation", "name")
      .select("bookingNumber status pickupStation renter vehicle createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    console.log("Total bookings in DB:", await Booking.countDocuments());
    console.log("Fetched bookings:", bookings.length);

    bookings.forEach((b, index) => {
      console.log(`[${index + 1}]`, {
        bookingNumber: b.bookingNumber,
        status: b.status,
        pickupStation: b.pickupStation?._id,
        stationName: b.pickupStation?.name,
        renter: b.renter?.fullName,
        vehicle: b.vehicle?.name,
      });
    });

    res.json({
      success: true,
      total: await Booking.countDocuments(),
      data: bookings,
    });
  } catch (error) {
    console.error("Error in getAllBookingsDebug:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get booking by ID
// @route   GET /api/staff/bookings/:id
// @access  Private/Staff
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("renter", "fullName email phone driverLicense nationalId")
      .populate("vehicle")
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

// @desc    Xem xét lại hồ sơ đã được phê duyệt hoặc từ chối
// @route   PATCH /api/staff/verifications/:userId/reconsider
// @access  Private/Staff
exports.reconsiderVerification = async (req, res) => {
  try {
    const { approved, verificationNote } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (user.role !== "renter") {
      return res
        .status(400)
        .json({ message: "Chỉ có thể xem xét lại hồ sơ người thuê" });
    }

    // Bắt buộc nhập note khi từ chối
    if (!approved && (!verificationNote || verificationNote.trim() === "")) {
      return res.status(400).json({
        message: "Vui lòng nhập lý do từ chối hồ sơ.",
      });
    }

    user.driverLicense.verified = approved;
    user.nationalId.verified = approved;
    user.verificationStatus = approved ? "approved" : "rejected";
    user.verificationNote = verificationNote;
    user.isVerified = approved;

    await user.save();

    res.json({
      success: true,
      message: approved
        ? "✅ Đã phê duyệt lại hồ sơ người thuê"
        : "❌ Đã từ chối lại hồ sơ người thuê",
      data: user,
    });
  } catch (error) {
    console.error("reconsiderVerification error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Handover vehicle to customer
// @route   PUT /api/staff/bookings/:id/handover
// @access  Private/Staff
exports.handoverVehicle = async (req, res) => {
  try {
    const { batteryLevel, odometer, condition, photos, notes, signature } =
      req.body;

    const booking = await Booking.findById(req.params.id).populate("vehicle");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        message:
          "Booking chưa được xác nhận. Trạng thái hiện tại: " + booking.status,
      });
    }

    // Verify staff is at the correct station
    if (
      booking.pickupStation.toString() !== req.user.assignedStation.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xử lý booking này" });
    }

    // Update pickup details
    booking.pickupDetails = {
      checkedInAt: new Date(),
      checkedInBy: req.user._id,
      batteryLevel: batteryLevel,
      odometer: odometer,
      condition: condition || "good",
      photos: photos || [],
      notes: notes || "",
      signature: signature || "",
    };

    // Update status and actual start date
    booking.status = "in-progress";
    booking.actualStartDate = new Date();

    await booking.save();

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
      status: "rented",
      batteryLevel: batteryLevel,
      odometer: odometer,
    });

    res.json({
      success: true,
      data: booking,
      message:
        "Đã bàn giao xe thành công. Chúc khách hàng có chuyến đi an toàn!",
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
      batteryLevel,
      odometer,
      condition,
      photos,
      notes,
      damageReport,
      additionalCharges = {}, // { cleaning: 0, repair: 0, lateFee: 0 }
      userConfirmed,
    } = req.body;

    const booking = await Booking.findById(req.params.id).populate("vehicle");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    if (booking.status !== "in-progress") {
      return res
        .status(400)
        .json({ message: "Xe chưa được bàn giao hoặc đã trả" });
    }

    // Verify staff is at the correct station
    if (
      booking.returnStation.toString() !== req.user.assignedStation.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xử lý booking này" });
    }

    // Calculate late fees
    const now = new Date();
    const expectedReturn = new Date(booking.endDate);
    let calculatedLateFee = 0;

    if (now > expectedReturn) {
      const lateHours = Math.ceil((now - expectedReturn) / (1000 * 60 * 60));
      calculatedLateFee = lateHours * booking.vehicle.pricePerHour * 1.5; // 1.5x for late fees
    }

    const lateFee = additionalCharges.lateFee || calculatedLateFee;
    const cleaningFee = additionalCharges.cleaning || 0;
    const repairFee = additionalCharges.repair || 0;
    const totalAdditionalCharges = lateFee + cleaningFee + repairFee;

    // Update return details
    booking.returnDetails = {
      checkedInAt: new Date(),
      checkedInBy: req.user._id,
      batteryLevel,
      odometer,
      condition,
      photos: photos || [],
      notes,
      damageReport,
    };

    // Add additional charges to pricing
    if (totalAdditionalCharges > 0) {
      if (lateFee > 0) {
        booking.pricing.additionalCharges.push({
          type: "late_fee",
          amount: lateFee,
          description: `Phí trả muộn: ${Math.ceil(
            (now - expectedReturn) / (1000 * 60 * 60)
          )} giờ`,
        });
      }
      if (cleaningFee > 0) {
        booking.pricing.additionalCharges.push({
          type: "cleaning",
          amount: cleaningFee,
          description: "Phí vệ sinh xe",
        });
      }
      if (repairFee > 0) {
        booking.pricing.additionalCharges.push({
          type: "repair",
          amount: repairFee,
          description: damageReport || "Phí sửa chữa",
        });
      }

      // Update status to require additional payment
      booking.status = "returning";

      // Create payment record for additional charges
      const Payment = require("../models/Payment");
      await Payment.create({
        booking: booking._id,
        user: booking.renter,
        type: "additional",
        amount: totalAdditionalCharges,
        method: "online",
        status: "pending",
        notes: `Phí phát sinh: ${lateFee > 0 ? "Trả muộn, " : ""}${
          cleaningFee > 0 ? "Vệ sinh, " : ""
        }${repairFee > 0 ? "Sửa chữa" : ""}`,
      });
    } else {
      // No additional charges, move to refund_pending
      booking.status = "refund_pending";

      // Calculate refund amount (deposit - additional charges)
      const refundAmount = booking.pricing.deposit;
      booking.depositRefund = {
        amount: refundAmount,
        method: "manual",
        status: "pending",
      };
    }

    await booking.save();

    // Update vehicle status to available
    await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
      status: "available",
      batteryLevel: batteryLevel,
      odometer: odometer,
    });

    res.json({
      success: true,
      data: booking,
      message:
        totalAdditionalCharges > 0
          ? `Xe đã được kiểm tra. Khách hàng cần thanh toán ${totalAdditionalCharges.toLocaleString()}đ phí phát sinh`
          : "Xe đã được kiểm tra và trả về thành công. Chờ xác nhận hoàn tiền",
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
      .populate("vehicle", "pricePerHour pricePerDay deposit")
      .populate("renter", "fullName email phone");

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
        ? hours * booking.vehicle.pricePerHour
        : days * booking.vehicle.pricePerDay;

    const summary = {
      booking,
      rentalAmount,
      deposit: booking.vehicle.deposit,
      lateFees: booking.lateFees || 0,
      damageCharges: booking.damageCharges || 0,
      totalAmount:
        rentalAmount + (booking.lateFees || 0) + (booking.damageCharges || 0),
      depositRefund: booking.vehicle.deposit - (booking.damageCharges || 0),
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

    const booking = await Booking.findById(bookingId).populate("vehicle");

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
        ? hours * booking.vehicle.pricePerHour
        : days * booking.vehicle.pricePerDay;

    const totalAmount =
      rentalAmount + (booking.lateFees || 0) + (booking.damageCharges || 0);

    // Create payment
    const payment = await Payment.create({
      bookingId,
      userId: booking.renter,
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

// @desc    Confirm manual refund (after bank transfer)
// @route   POST /api/staff/bookings/:id/confirm-refund
// @access  Private/Staff
exports.confirmManualRefund = async (req, res) => {
  try {
    const { refundAmount, transferReference, transferNotes } = req.body;

    const booking = await Booking.findById(req.params.id).populate(
      "renter",
      "email fullName"
    );

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    // Only allow refund for bookings that are returning or refund_pending
    if (!["returning", "refund_pending"].includes(booking.status)) {
      return res.status(400).json({
        message:
          "Booking chưa sẵn sàng hoàn tiền. Trạng thái hiện tại: " +
          booking.status,
      });
    }

    // Verify staff is at the correct station
    if (
      booking.returnStation.toString() !== req.user.assignedStation.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xử lý booking này" });
    }

    // If there are pending additional charges, don't allow refund yet
    const Payment = require("../models/Payment");
    const pendingPayments = await Payment.findOne({
      booking: booking._id,
      type: "additional",
      status: "pending",
    });

    if (pendingPayments) {
      return res.status(400).json({
        message:
          "Khách hàng chưa thanh toán phí phát sinh. Không thể hoàn tiền",
      });
    }

    // Calculate refund amount (should be deposit - additional charges)
    const totalAdditionalCharges = booking.pricing.additionalCharges.reduce(
      (sum, charge) => sum + charge.amount,
      0
    );
    const calculatedRefund = booking.pricing.deposit - totalAdditionalCharges;

    if (refundAmount && Math.abs(refundAmount - calculatedRefund) > 1) {
      return res.status(400).json({
        message: `Số tiền hoàn không khớp. Số tiền đúng: ${calculatedRefund.toLocaleString()}đ`,
      });
    }

    // Update deposit refund info
    booking.depositRefund = {
      amount: calculatedRefund,
      method: "manual",
      status: "refunded",
      refundedBy: req.user._id,
      refundedAt: new Date(),
      transferReference: transferReference || `REF${Date.now()}`,
      transferNotes: transferNotes || "",
    };

    booking.status = "refund_pending"; // Wait for user confirmation

    await booking.save();

    // Create refund payment record for audit
    await Payment.create({
      booking: booking._id,
      user: booking.renter,
      type: "refund",
      amount: calculatedRefund,
      method: "bank-transfer",
      status: "completed",
      processedBy: req.user._id,
      paidAt: new Date(),
      notes: `Hoàn tiền cọc. ${transferNotes || ""}`,
      details: {
        referenceNumber: transferReference,
      },
    });

    // TODO: Send notification to user to confirm receipt
    // await sendEmail(booking.renter.email, 'Xác nhận nhận tiền hoàn cọc', ...)

    res.json({
      success: true,
      data: booking,
      message: `Đã xác nhận chuyển khoản ${calculatedRefund.toLocaleString()}đ. Chờ khách hàng xác nhận nhận tiền`,
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

// @desc    Get current staff info (DEBUG)
// @route   GET /api/staff/me
// @access  Private/Staff
exports.getStaffInfo = async (req, res) => {
  try {
    const staff = await User.findById(req.user.id)
      .select("-password")
      .populate("assignedStation", "name address code");

    console.log("=== Staff Info Debug ===");
    console.log("Staff ID:", staff._id);
    console.log("Staff Name:", staff.fullName);
    console.log("Staff Role:", staff.role);
    console.log("Assigned Station ID:", staff.assignedStation?._id);
    console.log("Assigned Station Name:", staff.assignedStation?.name);

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Error in getStaffInfo:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Self-assign station (TEMPORARY FIX)
// @route   PUT /api/staff/assign-me
// @access  Private/Staff
exports.selfAssignStation = async (req, res) => {
  try {
    const { stationId } = req.body;

    if (!stationId) {
      return res.status(400).json({ message: "Vui lòng chọn station" });
    }

    const Station = require("../models/Station");
    const station = await Station.findById(stationId);

    if (!station) {
      return res.status(404).json({ message: "Không tìm thấy station" });
    }

    const staff = await User.findByIdAndUpdate(
      req.user.id,
      { assignedStation: stationId },
      { new: true }
    )
      .select("-password")
      .populate("assignedStation");

    // Update station's staff array
    if (!station.staff) {
      station.staff = [];
    }
    if (!station.staff.includes(req.user.id)) {
      station.staff.push(req.user.id);
      await station.save();
    }

    console.log("✅ Staff self-assigned to station");
    console.log("Staff:", staff.fullName);
    console.log("Station:", station.name);

    res.json({
      success: true,
      data: staff,
      message: `Đã phân công bạn vào ${station.name}`,
    });
  } catch (error) {
    console.error("Error in selfAssignStation:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
