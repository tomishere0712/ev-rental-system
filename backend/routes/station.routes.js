const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getStations,
  getStationById,
  getStationVehicles,
  searchNearbyStations,
} = require("../controllers/station.controller");

// @route   GET /api/stations
// @desc    Get all stations
// @access  Public
router.get("/", getStations);

// @route   GET /api/stations/search/nearby
// @desc    Search nearby stations
// @access  Public
router.get("/search/nearby", searchNearbyStations);

// @route   GET /api/stations/:id
// @desc    Get station by ID
// @access  Public
router.get("/:id", getStationById);

// @route   GET /api/stations/:id/vehicles
// @desc    Get available vehicles at station
// @access  Public
router.get("/:id/vehicles", getStationVehicles);

// @route   POST /api/stations
// @desc    Create new station
// @access  Private/Admin
router.post("/", protect, authorize("admin"), (req, res) => {
  // TODO: Implement create station logic
  res.json({ message: "Create station endpoint" });
});

// @route   PUT /api/stations/:id
// @desc    Update station
// @access  Private/Admin
router.put("/:id", protect, authorize("admin"), (req, res) => {
  // TODO: Implement update station logic
  res.json({ message: "Update station endpoint" });
});

module.exports = router;
