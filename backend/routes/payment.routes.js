const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  processPayment,
  getPaymentHistory,
  getPaymentById,
  createPaymentLink,
  paymentCallback,
  createVNPayUrl,
  vnpayReturn,
  vnpayQuery,
  createVNPayAdditionalUrl,
  vnpayAdditionalReturn,
} = require("../controllers/payment.controller");

// @route   POST /api/payments
// @desc    Process payment
// @access  Private
router.post("/", protect, processPayment);

// @route   POST /api/payments/create-payment-link
// @desc    Create PayOS payment link
// @access  Private (Renter)
router.post("/create-payment-link", protect, createPaymentLink);

// @route   POST /api/payments/callback
// @desc    Handle payment callback from PayOS
// @access  Public
router.post("/callback", paymentCallback);

// @route   POST /api/payments/create-vnpay-url
// @desc    Create VNPay payment URL
// @access  Private (Renter)
router.post("/create-vnpay-url", protect, createVNPayUrl);

// @route   GET /api/payments/vnpay-return
// @desc    Handle VNPay return callback
// @access  Public
router.get("/vnpay-return", vnpayReturn);

// @route   POST /api/payments/create-vnpay-additional-url
// @desc    Create VNPay payment URL for additional charges
// @access  Private (Renter)
router.post("/create-vnpay-additional-url", protect, createVNPayAdditionalUrl);

// @route   GET /api/payments/vnpay-additional-return
// @desc    Handle VNPay additional payment return callback
// @access  Public
router.get("/vnpay-additional-return", vnpayAdditionalReturn);

// @route   POST /api/payments/vnpay-query
// @desc    Query VNPay transaction
// @access  Private (Admin/Staff)
router.post("/vnpay-query", protect, authorize("admin", "staff"), vnpayQuery);

// @route   GET /api/payments
// @desc    Get payment history
// @access  Private
router.get("/", protect, getPaymentHistory);

// @route   GET /api/payments/:id
// @desc    Get payment by ID
// @access  Private
router.get("/:id", protect, getPaymentById);

// @route   POST /api/payments/:id/refund
// @desc    Process refund
// @access  Private/Staff/Admin
router.post("/:id/refund", protect, authorize("staff", "admin"), (req, res) => {
  // TODO: Implement refund logic - For Staff/Admin
  res.json({ message: "Process refund endpoint" });
});

module.exports = router;
