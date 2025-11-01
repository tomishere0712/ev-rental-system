const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { isStaff } = require("../middleware/roleAuth");
const staffController = require("../controllers/staff.controller");

// Apply protect and isStaff middleware to all routes
router.use(protect);
router.use(isStaff);

// Dashboard stats
router.get("/stats", staffController.getStaffStats);

// Bookings
router.get("/bookings", staffController.getStationBookings);
router.get("/bookings/:id", staffController.getBookingById);
router.put("/bookings/:id/verify", staffController.verifyCustomer);
router.put("/bookings/:id/handover", staffController.handoverVehicle);
router.put("/bookings/:id/return", staffController.returnVehicle);
router.get("/bookings/:id/payment", staffController.getPaymentSummary);

// Vehicles
router.get("/vehicles", staffController.getStationVehicles);
router.put("/vehicles/:id/battery", staffController.updateVehicleBattery);
router.post("/vehicles/:id/issue", staffController.reportVehicleIssue);
router.put("/vehicles/:id/status", staffController.updateVehicleStatus);

// Payments
router.post("/payments", staffController.processPayment);

// Lấy danh sách renter có trạng thái pending
router.get("/verifications/pending", staffController.getPendingVerifications);

// ✅ Lấy danh sách renter đã được phê duyệt
router.get("/verifications/approved", staffController.getApprovedVerifications);

// ✅ Lấy danh sách renter bị từ chối
router.get("/verifications/rejected", staffController.getRejectedVerifications);

// ✅ Nhân viên xác minh (phê duyệt / từ chối)
router.patch("/verifications/:userId", staffController.verifyUserDocuments);


module.exports = router;
