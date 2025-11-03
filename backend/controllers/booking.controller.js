const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const Payment = require("../models/Payment");

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Renter)
exports.createBooking = async (req, res) => {
  try {
    const { vehicle, pickupStation, returnStation, startDate, endDate } =
      req.body;

    // Check if vehicle exists and is available
    const vehicleDoc = await Vehicle.findById(vehicle).populate(
      "currentStation"
    );
    if (!vehicleDoc) {
      return res.status(404).json({ message: "Không tìm thấy xe" });
    }

    if (vehicleDoc.status !== "available") {
      return res.status(400).json({ message: "Xe không khả dụng" });
    }

    // Check for overlapping bookings (reserved, pending, confirmed, or in-progress)
    const start = new Date(startDate);
    const end = new Date(endDate);

    const overlappingBooking = await Booking.findOne({
      vehicle,
      status: { $in: ["reserved", "pending", "confirmed", "in-progress"] },
      $or: [
        // New booking starts during existing booking
        { startDate: { $lte: start }, endDate: { $gt: start } },
        // New booking ends during existing booking
        { startDate: { $lt: end }, endDate: { $gte: end } },
        // New booking contains existing booking
        { startDate: { $gte: start }, endDate: { $lte: end } },
      ],
    });

    if (overlappingBooking) {
      return res.status(400).json({
        message: "Xe đã có người đặt trong khoảng thời gian này",
        conflictBooking: overlappingBooking.bookingNumber,
      });
    }

    // Calculate pricing
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    const days = Math.ceil(hours / 24);

    let basePrice;
    if (hours <= 24) {
      basePrice = vehicleDoc.pricePerHour * hours;
    } else {
      basePrice = vehicleDoc.pricePerDay * days;
    }

    // Generate booking number manually (validation runs before pre-save hooks)
    const count = await Booking.countDocuments();
    const bookingNumber = `BK${Date.now()}${String(count + 1).padStart(
      4,
      "0"
    )}`;
    console.log("Generated bookingNumber:", bookingNumber);

    // Calculate reservation timeout (5 minutes from now)
    const reservedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create booking with "reserved" status
    const booking = new Booking({
      bookingNumber,
      renter: req.user.id,
      vehicle,
      station: pickupStation,
      pickupStation,
      returnStation,
      startDate,
      endDate,
      pricing: {
        basePrice,
        deposit: vehicleDoc.deposit,
        totalAmount: basePrice + vehicleDoc.deposit,
      },
      status: "reserved", // Giữ chỗ trong 5 phút
      reservedUntil,
    });
    await booking.save();
    console.log(
      "✅ Booking saved successfully:",
      bookingNumber,
      "- Reserved until:",
      reservedUntil
    );

    // Update vehicle status to "reserved" ngay khi giữ chỗ
    // Nếu hết 5 phút không thanh toán, scheduler sẽ hủy booking và cần trả xe về "available"
    await Vehicle.findByIdAndUpdate(vehicle, { status: "reserved" });
    console.log(
      "✅ Vehicle status updated to: reserved (holding for 5 minutes)"
    );

    // Populate booking details
    const populatedBooking = await Booking.findById(booking._id)
      .populate("vehicle")
      .populate("pickupStation")
      .populate("returnStation")
      .populate("renter", "fullName email phone");

    res.status(201).json({
      success: true,
      message: "Đặt xe thành công - Vui lòng thanh toán để xác nhận",
      data: populatedBooking,
    });
  } catch (error) {
    console.error("❌ Error creating booking:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings for current user
// @route   GET /api/bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    console.log("📋 getMyBookings - User:", req.user.id);
    console.log("📋 Query params:", { status, page, limit });

    const filter = {
      renter: req.user.id,
      // Hiện tất cả trạng thái - không filter cancelled nữa
    };

    // Handle status filter - support comma-separated values
    if (status) {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',').map(s => s.trim()) };
        console.log("📋 Status filter (multiple):", filter.status);
      } else {
        filter.status = status;
        console.log("📋 Status filter (single):", filter.status);
      }
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(filter)
      .populate("vehicle", "name model brand images licensePlate")
      .populate("pickupStation", "name address")
      .populate("returnStation", "name address")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    console.log("📋 Found bookings:", bookings.length);
    if (bookings.length > 0) {
      console.log("📋 Booking statuses:", bookings.map(b => ({ number: b.bookingNumber, status: b.status })));
    }

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ getMyBookings error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("vehicle")
      .populate("pickupStation")
      .populate("returnStation")
      .populate("renter", "fullName email phone avatar")
      .populate("pickupDetails.checkedInBy", "fullName")
      .populate("returnDetails.checkedInBy", "fullName");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn thuê" });
    }

    // Check if user owns this booking
    if (
      booking.renter._id.toString() !== req.user.id &&
      req.user.role !== "staff" &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn thuê" });
    }

    // Check if user owns this booking
    if (booking.renter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Không có quyền hủy đơn này" });
    }

    // Check if booking can be cancelled
    if (booking.status === "completed" || booking.status === "cancelled") {
      return res.status(400).json({ message: "Không thể hủy đơn thuê này" });
    }

    // Update booking status
    booking.status = "cancelled";
    booking.cancellation = {
      reason,
      cancelledBy: req.user.id,
      cancelledAt: Date.now(),
    };
    await booking.save();

    // Update vehicle status back to available
    await Vehicle.findByIdAndUpdate(booking.vehicle, { status: "available" });

    res.json({
      success: true,
      message: "Hủy đơn thuê thành công",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sign digital contract
// @route   POST /api/bookings/:id/sign-contract
// @access  Private (Renter)
exports.signContract = async (req, res) => {
  try {
    const { signature } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn thuê" });
    }

    // Check if user owns this booking
    if (booking.renter.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Không có quyền ký hợp đồng này" });
    }

    // Update contract
    booking.contract = {
      signed: true,
      signedAt: Date.now(),
      documentUrl: signature, // In real app, this would be a PDF URL
      terms: "Standard rental terms and conditions...",
    };

    booking.status = "confirmed";
    await booking.save();

    // Update vehicle status to reserved when booking is confirmed
    await Vehicle.findByIdAndUpdate(booking.vehicle, { status: "reserved" });

    res.json({
      success: true,
      message: "Ký hợp đồng thành công",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get rental history with analytics
// @route   GET /api/bookings/history/analytics
// @access  Private (Renter)
exports.getRentalHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({
      renter: req.user.id,
      status: "completed",
    })
      .populate("vehicle", "name model type")
      .populate("pickupStation", "name")
      .sort({ createdAt: -1 });

    // Calculate analytics
    const totalBookings = bookings.length;
    const totalSpent = bookings.reduce(
      (sum, booking) => sum + booking.pricing.totalAmount,
      0
    );

    // Calculate average cost per booking
    const avgCost = totalBookings > 0 ? totalSpent / totalBookings : 0;

    // Group by time (peak hours analysis)
    const bookingsByHour = {};
    bookings.forEach((booking) => {
      const hour = new Date(booking.startDate).getHours();
      bookingsByHour[hour] = (bookingsByHour[hour] || 0) + 1;
    });

    // Find peak hour
    const peakHour = Object.entries(bookingsByHour).sort(
      ([, a], [, b]) => b - a
    )[0];

    // Vehicle type preference
    const vehicleTypes = {};
    bookings.forEach((booking) => {
      const type = booking.vehicle.type;
      vehicleTypes[type] = (vehicleTypes[type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        bookings,
        analytics: {
          totalBookings,
          totalSpent,
          avgCost,
          peakHour: peakHour
            ? {
                hour: peakHour[0],
                count: peakHour[1],
              }
            : null,
          vehicleTypePreference: vehicleTypes,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    User confirms they received the manual refund
// @route   POST /api/bookings/:id/confirm-refund-received
// @access  Private/Renter
exports.confirmRefundReceived = async (req, res) => {
  try {
    console.log("💰 Confirm refund received:", req.params.id);
    console.log("👤 User ID:", req.user._id);
    console.log("👤 User object:", JSON.stringify(req.user, null, 2));

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    console.log("📋 Booking status:", booking.status);
    console.log("💵 Deposit refund:", booking.depositRefund);
    console.log("👤 Booking renter:", booking.renter);

    // Verify user is the renter
    const userId = req.user._id || req.user.id;
    if (booking.renter.toString() !== userId.toString()) {
      console.log("❌ User mismatch:", booking.renter.toString(), "vs", userId.toString());
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xác nhận booking này" });
    }

    // Only allow confirmation if status is refund_pending
    if (booking.status !== "refund_pending") {
      return res.status(400).json({
        message:
          "Booking chưa sẵn sàng xác nhận hoàn tiền. Trạng thái hiện tại: " +
          booking.status,
      });
    }

    // Initialize depositRefund if not exists
    if (!booking.depositRefund) {
      booking.depositRefund = {
        amount: booking.pricing?.deposit || 0,
        method: "bank_transfer",
        status: "refunded",
      };
    }

    // Update deposit refund confirmation
    booking.depositRefund.status = "confirmed";
    booking.depositRefund.confirmedBy = req.user._id;
    booking.depositRefund.confirmedAt = new Date();

    // Mark booking as completed
    booking.status = "completed";

    await booking.save();

    console.log("✅ Refund confirmed, booking completed");

    res.json({
      success: true,
      data: booking,
      message: `Đã xác nhận nhận tiền hoàn cọc ${(booking.depositRefund.amount || 0).toLocaleString()}đ. Cảm ơn bạn đã sử dụng dịch vụ!`,
    });
  } catch (error) {
    console.error("❌ Confirm refund error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm additional payment received (for cases where late fees exceed deposit)
// @route   POST /api/bookings/:id/confirm-additional-payment
// @access  Private/Renter
exports.confirmAdditionalPayment = async (req, res) => {
  try {
    console.log("💳 Confirm additional payment:", req.params.id);
    console.log("👤 User:", req.user._id);

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    console.log("📋 Booking status:", booking.status);
    console.log("💳 Additional payment:", booking.additionalPayment);

    // Verify user is the renter
    const userId = req.user._id || req.user.id;
    if (booking.renter.toString() !== userId.toString()) {
      console.log("❌ User mismatch:", booking.renter.toString(), "vs", userId.toString());
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xác nhận booking này" });
    }

    // Check if additional payment exists and is pending
    if (!booking.additionalPayment) {
      return res.status(400).json({
        message: "Booking này không có thanh toán bổ sung",
      });
    }

    if (booking.additionalPayment.status !== "pending") {
      return res.status(400).json({
        message: "Thanh toán bổ sung đã được xác nhận trước đó",
      });
    }

    // Update additional payment status
    booking.additionalPayment.status = "confirmed";
    booking.additionalPayment.confirmedBy = req.user._id;
    booking.additionalPayment.confirmedAt = new Date();

    // Mark booking as completed (since additional payment covers all charges)
    booking.status = "completed";

    await booking.save();

    console.log("✅ Additional payment confirmed, booking completed");

    res.json({
      success: true,
      data: booking,
      message: `Đã xác nhận thanh toán bổ sung ${(booking.additionalPayment.amount || 0).toLocaleString()}đ. Cảm ơn bạn đã sử dụng dịch vụ!`,
    });
  } catch (error) {
    console.error("❌ Confirm additional payment error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request vehicle return
// @route   POST /api/bookings/:id/request-return
// @access  Private/Renter
exports.requestReturn = async (req, res) => {
  try {
    const { returnNotes, returnLocation } = req.body;
    
    console.log("🔙 Return request:", req.params.id);
    console.log("👤 User:", req.user.id);

    const booking = await Booking.findById(req.params.id)
      .populate("vehicle", "name model licensePlate")
      .populate("returnStation", "name address");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn thuê" });
    }

    // Check ownership
    if (booking.renter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Không có quyền thực hiện thao tác này" });
    }

    // Check status
    if (booking.status !== "in-progress") {
      return res.status(400).json({
        message: `Không thể yêu cầu trả xe. Trạng thái hiện tại: ${booking.status}`,
      });
    }

    // Update return request
    booking.returnRequest = {
      requestedAt: new Date(),
      notes: returnNotes || "",
      location: returnLocation || booking.returnStation?.name || "Tại điểm trả xe đã đăng ký",
    };

    booking.status = "pending_return";

    await booking.save();

    console.log("✅ Return request created for:", booking.bookingNumber);

    res.json({
      success: true,
      data: booking,
      message: "Đã gửi yêu cầu trả xe. Staff sẽ liên hệ với bạn sớm nhất!",
    });
  } catch (error) {
    console.error("❌ Request return error:", error);
    res.status(500).json({ message: error.message });
  }
};
