const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  signContract,
  getRentalHistory,
  confirmRefundReceived,
} = require("../controllers/booking.controller");

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private/Renter
router.post("/", protect, authorize("renter"), createBooking);

// @route   GET /api/bookings
// @desc    Get all bookings for current user
// @access  Private
router.get("/", protect, getMyBookings);

// @route   GET /api/bookings/history/analytics
// @desc    Get rental history with analytics
// @access  Private/Renter
router.get(
  "/history/analytics",
  protect,
  authorize("renter"),
  getRentalHistory
);

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get("/:id", protect, getBookingById);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put("/:id/cancel", protect, cancelBooking);

// @route   POST /api/bookings/:id/sign-contract
// @desc    Sign digital contract
// @access  Private/Renter
router.post("/:id/sign-contract", protect, authorize("renter"), signContract);

// @route   POST /api/bookings/:id/confirm-refund-received
// @desc    User confirms they received the manual refund
// @access  Private/Renter
router.post(
  "/:id/confirm-refund-received",
  protect,
  authorize("renter"),
  confirmRefundReceived
);

// @route   PUT /api/bookings/:id/pickup
// @desc    Process vehicle pickup (Staff)
// @access  Private/Staff
router.put("/:id/pickup", protect, authorize("staff"), (req, res) => {
  // TODO: Implement pickup logic (photos, battery level, odometer, signature) - For Staff
  res.json({ message: "Process pickup endpoint" });
});

// @route   PUT /api/bookings/:id/return
// @desc    Process vehicle return (Staff)
// @access  Private/Staff
router.put("/:id/return", protect, authorize("staff"), (req, res) => {
  // TODO: Implement return logic (photos, battery level, odometer, damage check) - For Staff
  res.json({ message: "Process return endpoint" });
});

module.exports = router;
