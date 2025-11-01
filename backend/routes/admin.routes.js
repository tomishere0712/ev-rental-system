const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { isAdmin } = require("../middleware/roleAuth");
const adminController = require("../controllers/admin.controller");

// Apply protect and isAdmin middleware to all routes
router.use(protect);
router.use(isAdmin);

// Dashboard Stats
router.get("/stats/overview", adminController.getOverviewStats);
router.get("/stats/revenue-by-station", adminController.getRevenueByStation);
router.get("/stats/bookings-trend", adminController.getBookingsTrend);
router.get(
  "/stats/vehicle-distribution",
  adminController.getVehicleDistribution
);

// Vehicles Management
router.get("/vehicles", adminController.getAllVehicles);
router.post("/vehicles", adminController.createVehicle);
router.put("/vehicles/:id", adminController.updateVehicle);
router.delete("/vehicles/:id", adminController.deleteVehicle);
router.put("/vehicles/:id/transfer", adminController.transferVehicle);

// Stations Management
router.get("/stations", adminController.getAllStations);
router.post("/stations", adminController.createStation);
router.put("/stations/:id", adminController.updateStation);
router.delete("/stations/:id", adminController.deleteStation);

// Users Management
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id/risk-level", adminController.updateUserRiskLevel);
router.put("/users/:id/block", adminController.blockUser);

// Staff Management
router.get("/staff", adminController.getAllStaff);
router.post("/staff", adminController.createStaff);
router.put("/staff/:id", adminController.updateStaff);
router.delete("/staff/:id", adminController.deleteStaff);
router.get("/staff/:id/performance", adminController.getStaffPerformance);

module.exports = router;
