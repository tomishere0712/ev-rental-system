const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getVehicles,
  getVehicleById,
  searchNearbyVehicles,
} = require("../controllers/vehicle.controller");

// @route   GET /api/vehicles
// @desc    Get all vehicles with filters
// @access  Public
router.get("/", getVehicles);

// @route   GET /api/vehicles/search/nearby
// @desc    Search vehicles by location
// @access  Public
router.get("/search/nearby", searchNearbyVehicles);

// @route   GET /api/vehicles/:id
// @desc    Get vehicle by ID
// @access  Public
router.get("/:id", getVehicleById);

// @route   POST /api/vehicles
// @desc    Create new vehicle
// @access  Private/Admin
router.post("/", protect, authorize("admin"), (req, res) => {
  // TODO: Implement create vehicle logic (for Admin)
  res.json({ message: "Create vehicle endpoint" });
});

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle
// @access  Private/Admin/Staff
router.put("/:id", protect, authorize("admin", "staff"), (req, res) => {
  // TODO: Implement update vehicle logic (for Admin/Staff)
  res.json({ message: "Update vehicle endpoint" });
});

// @route   PUT /api/vehicles/:id/status
// @desc    Update vehicle status
// @access  Private/Staff
router.put("/:id/status", protect, authorize("staff", "admin"), (req, res) => {
  // TODO: Implement update vehicle status logic (for Staff)
  res.json({ message: "Update vehicle status endpoint" });
});

// @route   POST /api/vehicles/:id/report-issue
// @desc    Report vehicle issue
// @access  Private/Staff
router.post(
  "/:id/report-issue",
  protect,
  authorize("staff", "admin"),
  (req, res) => {
    // TODO: Implement report issue logic (for Staff)
    res.json({ message: "Report vehicle issue endpoint" });
  }
);

module.exports = router;
