const Payment = require("../models/Payment");
const Booking = require("../models/Booking");

// @desc    Process payment
// @route   POST /api/payments
// @access  Private
exports.processPayment = async (req, res) => {
  try {
    const { booking, type, method, amount, details } = req.body;

    // Check if booking exists
    const bookingDoc = await Booking.findById(booking);
    if (!bookingDoc) {
      return res.status(404).json({ message: "Không tìm thấy đơn thuê" });
    }

    // Check if user owns this booking
    if (bookingDoc.renter.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Không có quyền thanh toán đơn này" });
    }

    // Create payment
    const payment = await Payment.create({
      booking,
      user: req.user.id,
      type,
      method,
      amount,
      details,
      status: "completed", // In real app, would integrate with payment gateway
      paidAt: Date.now(),
    });

    res.status(201).json({
      success: true,
      message: "Thanh toán thành công",
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payment history
// @route   GET /api/payments
// @access  Private
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ user: req.user.id })
      .populate("booking", "bookingNumber startDate endDate")
      .populate({
        path: "booking",
        populate: {
          path: "vehicle",
          select: "name model brand",
        },
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await Payment.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("booking")
      .populate("user", "fullName email phone")
      .populate({
        path: "booking",
        populate: {
          path: "vehicle",
          select: "name model brand licensePlate",
        },
      });

    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    }

    // Check if user owns this payment
    if (
      payment.user._id.toString() !== req.user.id &&
      req.user.role !== "staff" &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
