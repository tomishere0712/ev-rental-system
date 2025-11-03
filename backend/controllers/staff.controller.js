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
      console.log("🔍 Searching for:", search);
      
      // First, find booking by booking number (case-insensitive, partial match)
      const bookingByNumber = await Booking.findOne({
        bookingNumber: { $regex: search, $options: "i" },
        pickupStation: staff.assignedStation,
      })
        .populate("renter", "fullName email phone")
        .populate("vehicle", "name model licensePlate images pricePerDay")
        .populate("pickupStation", "name address")
        .populate("returnStation", "name address");

      if (bookingByNumber) {
        console.log("✅ Found booking by number:", bookingByNumber.bookingNumber);
        console.log("  → Status:", bookingByNumber.status);
        console.log("  → Renter:", bookingByNumber.renter?.fullName);
        console.log("  → Vehicle:", bookingByNumber.vehicle?.name);
        return res.json({
          success: true,
          data: [bookingByNumber],
        });
      }

      console.log("❌ No booking found by number, searching by email...");

      // If not found by booking number, search by user email
      const usersByEmail = await User.find({
        email: { $regex: search, $options: "i" },
      }).select("_id");

      console.log("📧 Users found by email:", usersByEmail.length);

      if (usersByEmail.length > 0) {
        filter.renter = { $in: usersByEmail.map((u) => u._id) };
      } else {
        // No user found with this email
        console.log("❌ No bookings or users found");
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
    const { pickupBatteryLevel, pickupPhotos, pickupNotes, signature, batteryLevel, odometer, condition, photos, notes } =
      req.body;

    console.log("🚗 Handover request:", req.params.id);
    console.log("📦 Body:", req.body);
    console.log("👤 User:", req.user.id);

    const booking = await Booking.findById(req.params.id).populate("vehicle");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    console.log("📋 Booking found:", booking.bookingNumber);
    console.log("📍 Pickup station:", booking.pickupStation);
    console.log("👷 Staff station:", req.user.assignedStation);

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        message:
          "Booking chưa được xác nhận. Trạng thái hiện tại: " + booking.status,
      });
    }

    // Verify staff is at the correct station (only if both exist)
    if (booking.pickupStation && req.user.assignedStation) {
      if (
        booking.pickupStation.toString() !== req.user.assignedStation.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền xử lý booking này" });
      }
    }

    // Update pickup details - Support both old and new field names
    booking.pickupDetails = {
      checkedInAt: new Date(),
      checkedInBy: req.user._id,
      batteryLevel: pickupBatteryLevel || batteryLevel || 0,
      odometer: odometer || 0,
      condition: condition || "good",
      photos: pickupPhotos || photos || [],
      notes: pickupNotes || notes || "",
      signature: signature || "",
    };

    // Update status and actual start date
    booking.status = "in-progress";
    booking.actualStartDate = new Date();

    await booking.save();

    console.log("✅ Booking updated, updating vehicle...");

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
      status: "rented",
      batteryLevel: pickupBatteryLevel || batteryLevel || 0,
      odometer: odometer || 0,
    });

    console.log("✅ Handover complete!");

    res.json({
      success: true,
      data: booking,
      message:
        "Đã bàn giao xe thành công. Chúc khách hàng có chuyến đi an toàn!",
    });
  } catch (error) {
    console.error("💥 Handover error:", error);
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
      returnBatteryLevel,
      odometer,
      condition,
      photos,
      returnPhotos,
      notes,
      returnNotes,
      damageReport,
      additionalCharges = {}, // { cleaning: 0, repair: 0, lateFee: 0 }
      lateFees,
      userConfirmed,
      additionalPayment, // New field for payment when lateFees > deposit
    } = req.body;

    console.log("🔙 Return vehicle request:", req.params.id);
    console.log("📦 Body:", req.body);

    const booking = await Booking.findById(req.params.id).populate("vehicle");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    console.log("🔙 Return vehicle - Booking status:", booking.status);

    // Allow return for both in-progress and pending_return status
    if (booking.status !== "in-progress" && booking.status !== "pending_return") {
      return res
        .status(400)
        .json({ message: "Xe chưa được bàn giao hoặc đã trả. Trạng thái hiện tại: " + booking.status });
    }

    console.log("📍 Return station:", booking.returnStation);
    console.log("👷 Staff station:", req.user.assignedStation);

    // Verify staff is at the correct station (only if both values exist)
    if (booking.returnStation && req.user.assignedStation) {
      if (
        booking.returnStation.toString() !== req.user.assignedStation.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền xử lý booking này" });
      }
    }

    // Calculate late fees
    const now = new Date();
    const expectedReturn = new Date(booking.endDate);
    let calculatedLateFee = 0;

    if (now > expectedReturn) {
      const lateHours = Math.ceil((now - expectedReturn) / (1000 * 60 * 60));
      const hourlyRate = booking.vehicle?.pricePerHour || booking.vehicle?.pricePerDay / 24 || 0;
      calculatedLateFee = lateHours * hourlyRate * 1.5; // 1.5x for late fees
      console.log("⏰ Late return detected:", { lateHours, hourlyRate, calculatedLateFee });
    }

    // Support both old (additionalCharges) and new (lateFees) formats
    const lateFee = lateFees || additionalCharges.lateFee || calculatedLateFee;
    const cleaningFee = additionalCharges.cleaning || 0;
    const repairFee = additionalCharges.repair || 0;
    const totalAdditionalCharges = lateFee + cleaningFee + repairFee;

    console.log("💰 Late fees:", { calculatedLateFee, lateFee, totalAdditionalCharges });
    console.log("💰 Deposit:", booking.pricing?.deposit || 0);

    // Update return details - Support both old and new field names
    booking.returnDetails = {
      checkedInAt: new Date(),
      checkedInBy: req.user._id,
      batteryLevel: returnBatteryLevel || batteryLevel || 0,
      odometer: odometer || 0,
      condition: condition || "good",
      photos: returnPhotos || photos || [],
      notes: returnNotes || notes || "",
      damageReport: damageReport || "",
    };

    console.log("✅ Return details:", booking.returnDetails);

    // Initialize pricing if not exists
    if (!booking.pricing) {
      booking.pricing = {
        basePrice: 0,
        deposit: 0,
        additionalCharges: [],
        discount: 0,
        totalAmount: 0,
      };
    }

    // Initialize additionalCharges array if not exists
    if (!Array.isArray(booking.pricing.additionalCharges)) {
      booking.pricing.additionalCharges = [];
    }

    console.log("💰 Current additional charges:", booking.pricing.additionalCharges);

    // Add additional charges to pricing
    if (totalAdditionalCharges > 0) {
      if (lateFee > 0) {
        const lateHours = now > expectedReturn ? Math.ceil((now - expectedReturn) / (1000 * 60 * 60)) : 0;
        const description = lateHours > 0 
          ? `Phí trả muộn: ${lateHours} giờ`
          : "Phí trả muộn và các chi phí khác";
        booking.pricing.additionalCharges.push({
          type: "late_fee",
          amount: Number(lateFee),
          description: description,
        });
        console.log("➕ Added late fee:", lateFee);
      }
      if (cleaningFee > 0) {
        booking.pricing.additionalCharges.push({
          type: "cleaning",
          amount: Number(cleaningFee),
          description: "Phí vệ sinh xe",
        });
        console.log("➕ Added cleaning fee:", cleaningFee);
      }
      if (repairFee > 0) {
        booking.pricing.additionalCharges.push({
          type: "repair",
          amount: Number(repairFee),
          description: damageReport || "Phí sửa chữa",
        });
        console.log("➕ Added repair fee:", repairFee);
      }

      console.log("💰 Total charges after push:", booking.pricing.additionalCharges.length);

      // Check if additional payment is required (lateFees > deposit)
      const deposit = booking.pricing.deposit || 0;
      const requiresAdditionalPayment = totalAdditionalCharges > deposit;

      console.log("🔍 Requires additional payment:", requiresAdditionalPayment);

      if (requiresAdditionalPayment) {
        // Additional payment required - Create pending payment
        console.log("💳 Additional payment required, creating pending payment...");

        try {
          const additionalAmount = totalAdditionalCharges - deposit;
          
          // Save additional payment info as pending (waiting for VNPAY payment)
          booking.additionalPayment = {
            amount: additionalAmount,
            transactionId: null, // Will be set after VNPAY payment
            paidAt: null, // Will be set after VNPAY payment
            method: "vnpay",
            status: "pending", // Pending payment via VNPAY
            notes: `Cần thanh toán thêm ${additionalAmount}đ do chi phí phát sinh vượt tiền cọc`,
          };

          // Keep status as pending_return until payment is completed
          booking.status = "pending_return";
          booking.depositRefund = {
            amount: 0, // No refund since charges exceeded deposit
            method: "none",
            status: "pending_payment", // Waiting for additional payment
            notes: `Chi phí phát sinh ${totalAdditionalCharges}đ vượt tiền cọc ${deposit}đ. Chờ thanh toán thêm ${additionalAmount}đ qua VNPAY`,
          };
          
          console.log("✅ Pending payment created:", booking.additionalPayment);
        } catch (err) {
          console.error("❌ Error creating pending payment:", err);
          throw new Error("Không thể tạo yêu cầu thanh toán bổ sung: " + err.message);
        }
      } else {
        // Additional charges exist but within deposit
        booking.status = "refund_pending";
        const refundAmount = deposit - totalAdditionalCharges;
        booking.depositRefund = {
          amount: refundAmount,
          method: "manual",
          status: "pending",
          notes: `Tiền cọc ${deposit}đ - Chi phí phát sinh ${totalAdditionalCharges}đ = Hoàn ${refundAmount}đ`,
        };
        console.log("✅ Refund calculated:", booking.depositRefund);
      }
    } else {
      // No additional charges, move to refund_pending
      booking.status = "refund_pending";

      // Calculate refund amount (full deposit)
      const refundAmount = booking.pricing?.deposit || 0;
      booking.depositRefund = {
        amount: refundAmount,
        method: "manual",
        status: "pending",
      };
      console.log("✅ Full refund:", booking.depositRefund);
    }

    console.log("💾 Saving booking...");
    await booking.save();
    console.log("✅ Booking saved successfully");

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
          ? booking.additionalPayment 
            ? `Xe đã được trả thành công. Đã thanh toán thêm ${booking.additionalPayment.amount.toLocaleString()}đ. Chờ xác nhận hoàn thành.`
            : `Xe đã được kiểm tra. Chờ hoàn tiền cọc ${booking.depositRefund.amount.toLocaleString()}đ`
          : "Xe đã được kiểm tra và trả về thành công. Chờ xác nhận hoàn tiền",
    });
  } catch (error) {
    console.error("💥 Return vehicle error:", error);
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
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pendingBookings = await Booking.countDocuments({
      pickupStation: staff.assignedStation,
      status: "pending",
    });

    const activeRentals = await Booking.countDocuments({
      pickupStation: staff.assignedStation,
      status: "in-progress",
    });

    const todayPickups = await Booking.countDocuments({
      pickupStation: staff.assignedStation,
      startDate: { $gte: today, $lt: tomorrow },
      status: { $in: ["confirmed", "in-progress"] },
    });

    const todayReturns = await Booking.countDocuments({
      returnStation: staff.assignedStation,
      endDate: { $gte: today, $lt: tomorrow },
      status: { $in: ["in-progress", "pending_return"] },
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
