const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  processPayment,
  getPaymentHistory,
  getPaymentById,
} = require("../controllers/payment.controller");

// @route   POST /api/payments
// @desc    Process payment
// @access  Private
router.post("/", protect, processPayment);

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
