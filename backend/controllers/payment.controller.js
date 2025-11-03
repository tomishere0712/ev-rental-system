const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const crypto = require("crypto");
const vnpayHelper = require("../utils/vnpayHelper");

// PayOS Configuration for Sandbox
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || "sandbox_client_id";
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || "sandbox_api_key";
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || "sandbox_checksum_key";

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

// @desc    Create PayOS payment link for booking
// @route   POST /api/payments/create-payment-link
// @access  Private (Renter)
exports.createPaymentLink = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ 
        success: false,
        message: "bookingId là bắt buộc" 
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate("vehicle", "name model");
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy đơn thuê" 
      });
    }

    // Check if user is the owner of the booking
    if (booking.renter.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: "Bạn không có quyền thanh toán đơn thuê này" 
      });
    }

    // Generate order code (must be unique)
    const orderCode = Date.now();
    const amount = booking.pricing?.totalAmount || 0;
    const description = `Thuê xe ${booking.vehicle?.name} #${bookingId.slice(-8)}`;

    // Return URL after payment (SANDBOX MODE)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const mockPaymentUrl = `${baseUrl}/payment/sandbox?bookingId=${bookingId}&amount=${amount}&orderCode=${orderCode}`;

    // Update booking with payment info
    if (!booking.payment) {
      booking.payment = {};
    }
    booking.payment.orderCode = orderCode.toString();
    booking.payment.amount = amount;
    booking.payment.status = "pending";
    booking.payment.method = "online";
    await booking.save();

    res.json({
      success: true,
      data: {
        paymentUrl: mockPaymentUrl,
        orderCode: orderCode,
        amount: amount,
        bookingId: bookingId,
      },
      message: "Tạo link thanh toán thành công",
    });

  } catch (error) {
    console.error("Create payment link error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Lỗi khi tạo link thanh toán"
    });
  }
};

// @desc    Handle payment callback (from PayOS sandbox)
// @route   POST /api/payments/callback
// @access  Public
exports.paymentCallback = async (req, res) => {
  try {
    const { orderCode, status, bookingId } = req.body;

    console.log("Payment callback received:", { orderCode, status, bookingId });

    if (!orderCode || !bookingId) {
      return res.status(400).json({ 
        success: false,
        message: "Thiếu thông tin callback" 
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy đơn thuê" 
      });
    }

    // Initialize payment object if not exists
    if (!booking.payment) {
      booking.payment = {
        orderCode: orderCode.toString(),
        method: "online",
        amount: 0,
      };
    }

    // Update payment status
    if (status === "success" || status === "PAID") {
      booking.payment.status = "completed";
      booking.payment.paidAt = new Date();
      booking.status = "confirmed"; // Update booking status
      await booking.save();

      res.json({
        success: true,
        message: "Thanh toán thành công",
        data: booking,
      });
    } else {
      booking.payment.status = "failed";
      await booking.save();

      res.status(400).json({
        success: false,
        message: "Thanh toán thất bại",
      });
    }

  } catch (error) {
    console.error("Payment callback error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Lỗi xử lý callback thanh toán"
    });
  }
};

// @desc    Create VNPay payment URL
// @route   POST /api/payments/create-vnpay-url
// @access  Private (Renter)
exports.createVNPayUrl = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId là bắt buộc",
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId).populate(
      "vehicle",
      "name model"
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn thuê",
      });
    }

    // Check if user is the owner of the booking
    if (booking.renter.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thanh toán đơn thuê này",
      });
    }

    // Get client IP
   let ipAddr =
  req.headers["x-forwarded-for"] ||
  req.connection.remoteAddress ||
  req.socket?.remoteAddress ||
  (req.connection.socket ? req.connection.socket.remoteAddress : null);

if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
  ipAddr = '127.0.0.1'; // ép IPv4 cho local
}


    // Prepare payment data
    const orderId = Date.now().toString();
    const amount = booking.pricing?.totalAmount || 0;
    // Remove # to avoid URL parsing issues with VNPay
    const orderInfo = `Thanh toan don thue xe ${booking.vehicle?.name} - ${bookingId.slice(-8)}`;

    // Create VNPay payment URL
    const paymentUrl = vnpayHelper.createPaymentUrl({
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      ipAddr: ipAddr,
      locale: "vn",
    });

    console.log("=== VNPay Payment URL Created ===");
    console.log("Order ID:", orderId);
    console.log("Amount:", amount);
    console.log("Payment URL:", paymentUrl);
    console.log("TMN Code:", process.env.VNPAY_TMN_CODE);

    // Update booking with payment info
    if (!booking.payment) {
      booking.payment = {};
    }
    booking.payment.orderCode = orderId;
    booking.payment.amount = amount;
    booking.payment.status = "pending";
    booking.payment.method = "online";
    await booking.save();

    res.json({
      success: true,
      data: {
        paymentUrl: paymentUrl,
        orderCode: orderId,
        amount: amount,
        bookingId: bookingId,
      },
      message: "Tạo link thanh toán VNPay thành công",
    });
  } catch (error) {
    console.error("Create VNPay URL error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi tạo link thanh toán VNPay",
    });
  }
};

// @desc    Handle VNPay return callback
// @route   GET /api/payments/vnpay-return
// @access  Public
exports.vnpayReturn = async (req, res) => {
  try {
    let vnpParams = { ...req.query };
    console.log("=== VNPay Return Callback ===");
    console.log("Received params:", vnpParams);

    // Verify signature
    const isValid = vnpayHelper.verifyReturnUrl({ ...vnpParams });

    if (!isValid) {
      console.error("❌ Signature verification FAILED");
      return res.status(400).json({
        success: false,
        message: "Chữ ký không hợp lệ",
      });
    }

    console.log("✅ Signature verified successfully");

    const orderId = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionNo = vnpParams.vnp_TransactionNo;
    const amount = vnpParams.vnp_Amount / 100; // Convert back from smallest unit

    console.log("Order ID:", orderId);
    console.log("Response Code:", responseCode);
    console.log("Transaction No:", transactionNo);
    console.log("Amount:", amount);

    // Find booking by orderCode
    const booking = await Booking.findOne({ "payment.orderCode": orderId });

    if (!booking) {
      console.error("❌ Booking not found with orderCode:", orderId);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn thuê",
      });
    }

    console.log("Found booking:", booking._id);

    // Update booking based on response code
    if (responseCode === "00") {
      // Payment success
      console.log("✅ Payment SUCCESS - Updating booking...");
      booking.payment.status = "completed";
      booking.payment.paidAt = new Date();
      booking.payment.transactionNo = transactionNo;
      booking.status = "pending"; // Chờ xác nhận từ staff
      await booking.save();

      // Update vehicle status to reserved
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: "reserved" });
      console.log("✅ Vehicle status updated to: reserved");
      console.log("✅ Booking status: pending (chờ xác nhận từ staff)");

      console.log("Booking updated successfully");

      // Redirect to success page
      const redirectUrl = `${process.env.CLIENT_URL}/payment/success?bookingId=${booking._id}&orderId=${orderId}`;
      return res.redirect(redirectUrl);
    } else {
      // Payment failed or cancelled
      console.log("❌ Payment FAILED/CANCELLED - Response code:", responseCode);
      
      // Update booking payment status
      booking.payment.status = "failed";
      booking.payment.transactionNo = transactionNo;
      
      // Cancel the booking
      booking.status = "cancelled";
      booking.cancelledAt = new Date();
      booking.cancellationReason = `Thanh toán thất bại hoặc bị hủy. Mã lỗi: ${responseCode}`;
      
      await booking.save();

      // Trả xe về trạng thái available
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: "available" });
      console.log("✅ Vehicle returned to available due to payment failure");

      console.log("✅ Booking cancelled due to payment failure");

      // Redirect to failed page
      const redirectUrl = `${process.env.CLIENT_URL}/payment/failed?bookingId=${booking._id}&orderId=${orderId}&code=${responseCode}`;
      return res.redirect(redirectUrl);
    }
  } catch (error) {
    console.error("❌ VNPay return error:", error);
    const redirectUrl = `${process.env.CLIENT_URL}/payment/failed?error=${encodeURIComponent(error.message)}`;
    return res.redirect(redirectUrl);
  }
};

// @desc    Create VNPay URL for additional payment (chi phí phát sinh)
// @route   POST /api/payments/vnpay-additional
// @access  Private (Renter)
exports.createVNPayAdditionalUrl = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId là bắt buộc",
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId).populate(
      "vehicle",
      "name model"
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn thuê",
      });
    }

    // Check if user is the owner of the booking
    if (booking.renter.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thanh toán đơn thuê này",
      });
    }

    // Check if additional payment is required
    if (!booking.additionalPayment || booking.additionalPayment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Không có chi phí phát sinh cần thanh toán",
      });
    }

    // Get client IP
    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket?.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null);

    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
    }

    // Prepare payment data
    const orderId = `ADDITIONAL_${Date.now()}`;
    const amount = booking.additionalPayment.amount;
    const orderInfo = `Chi phi phat sinh don thue ${booking.vehicle?.name} - ${bookingId.slice(-8)}`;
    
    // Use separate return URL for additional payment
    const returnUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/vnpay-additional-return`;

    // Create VNPay payment URL
    const paymentUrl = vnpayHelper.createPaymentUrl({
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      ipAddr: ipAddr,
      locale: "vn",
      returnUrl: returnUrl, // Pass custom return URL
    });

    console.log("=== VNPay Additional Payment URL Created ===");
    console.log("Order ID:", orderId);
    console.log("Amount:", amount);
    console.log("Booking ID:", bookingId);
    console.log("Return URL:", returnUrl);

    // Save orderId to additionalPayment for callback verification
    console.log("💾 Saving orderId to booking...");
    console.log("Before save - additionalPayment:", JSON.stringify(booking.additionalPayment, null, 2));
    
    try {
      // Set orderId
      booking.additionalPayment.orderId = orderId;
      
      // Mark subdocument as modified (important for nested objects in Mongoose)
      booking.markModified('additionalPayment');
      
      const savedBooking = await booking.save();
      console.log("✅ OrderId saved successfully");
      console.log("After save - additionalPayment.orderId:", savedBooking.additionalPayment.orderId);
      
      // Verify by re-querying from database
      const verifyBooking = await Booking.findById(bookingId).select('additionalPayment');
      console.log("🔍 Verification - orderId in DB:", verifyBooking.additionalPayment.orderId);
    } catch (saveError) {
      console.error("❌ Error saving orderId to booking:", saveError);
      throw saveError;
    }

    res.json({
      success: true,
      data: {
        paymentUrl: paymentUrl,
        orderCode: orderId,
        amount: amount,
        bookingId: bookingId,
      },
      message: "Tạo link thanh toán chi phí phát sinh thành công",
    });
  } catch (error) {
    console.error("Create VNPay Additional URL error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi tạo link thanh toán",
    });
  }
};

// @desc    Handle VNPay return callback for additional payment
// @route   GET /api/payments/vnpay-additional-return
// @access  Public
exports.vnpayAdditionalReturn = async (req, res) => {
  try {
    let vnpParams = { ...req.query };
    console.log("=== VNPay Additional Payment Return ===");
    console.log("Received params:", vnpParams);

    // Verify signature
    const isValid = vnpayHelper.verifyReturnUrl({ ...vnpParams });

    if (!isValid) {
      console.error("❌ Signature verification FAILED");
      return res.status(400).json({
        success: false,
        message: "Chữ ký không hợp lệ",
      });
    }

    console.log("✅ Signature verified successfully");

    const orderId = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionNo = vnpParams.vnp_TransactionNo;
    const amount = vnpParams.vnp_Amount / 100;

    console.log("Order ID:", orderId);
    console.log("Response Code:", responseCode);
    console.log("Transaction No:", transactionNo);
    console.log("Amount:", amount);

    // Find booking by additionalPayment.orderId
    console.log("🔍 Searching for booking with additionalPayment.orderId:", orderId);
    const booking = await Booking.findOne({ "additionalPayment.orderId": orderId });

    if (!booking) {
      console.error("❌ Booking not found with orderId:", orderId);
      
      // Debug: Try to find any booking with pending additional payment
      const anyPendingBooking = await Booking.findOne({ 
        "additionalPayment.status": "pending" 
      }).select("_id bookingCode additionalPayment");
      
      console.log("📋 Found pending additional payment booking:", anyPendingBooking);
      
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn thuê",
      });
    }

    console.log("Found booking:", booking._id);

    // Update booking based on response code
    if (responseCode === "00") {
      // Payment success
      console.log("✅ Additional Payment SUCCESS - Updating booking...");
      
      booking.additionalPayment.status = "paid";
      booking.additionalPayment.transactionId = transactionNo;
      booking.additionalPayment.paidAt = new Date();
      booking.additionalPayment.method = "vnpay";

      // Update depositRefund status
      booking.depositRefund.status = "not_applicable";
      booking.depositRefund.amount = 0;
      booking.depositRefund.notes = `Chi phí phát sinh đã thanh toán thành công qua VNPAY. Mã GD: ${transactionNo}`;

      // Move booking to refund_pending (waiting for staff to confirm receipt)
      booking.status = "refund_pending";
      
      await booking.save();

      console.log("✅ Booking updated successfully - Status: refund_pending, additionalPayment.status: paid");

      // Redirect to success page
      const redirectUrl = `${process.env.CLIENT_URL}/payment/additional-success?bookingId=${booking._id}&orderId=${orderId}`;
      return res.redirect(redirectUrl);
    } else {
      // Payment failed or cancelled
      console.log("❌ Additional Payment FAILED/CANCELLED - Response code:", responseCode);
      
      booking.additionalPayment.status = "failed";
      booking.additionalPayment.transactionId = transactionNo;
      booking.additionalPayment.notes = `Thanh toán thất bại. Mã lỗi: ${responseCode}`;
      
      await booking.save();

      console.log("✅ Booking updated with payment failure");

      // Redirect to failed page
      const redirectUrl = `${process.env.CLIENT_URL}/payment/additional-failed?bookingId=${booking._id}&orderId=${orderId}&code=${responseCode}`;
      return res.redirect(redirectUrl);
    }
  } catch (error) {
    console.error("❌ VNPay additional return error:", error);
    const redirectUrl = `${process.env.CLIENT_URL}/payment/failed?error=${encodeURIComponent(error.message)}`;
    return res.redirect(redirectUrl);
  }
};

// @desc    Query VNPay transaction
// @route   POST /api/payments/vnpay-query
// @access  Private (Admin/Staff)
exports.vnpayQuery = async (req, res) => {
  try {
    const { orderId, transDate } = req.body;

    if (!orderId || !transDate) {
      return res.status(400).json({
        success: false,
        message: "orderId và transDate là bắt buộc",
      });
    }

    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    const queryData = await vnpayHelper.queryTransaction({
      orderId,
      transDate,
      ipAddr,
    });

    res.json({
      success: true,
      data: queryData,
    });
  } catch (error) {
    console.error("VNPay query error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi tra cứu giao dịch",
    });
  }
};
