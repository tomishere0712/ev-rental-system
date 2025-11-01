const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  register,
  login,
  getMe,
  uploadDocuments,
  updateProfile,
} = require("../controllers/auth.controller");

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", protect, getMe);

// @route   POST /api/auth/upload-documents
// @desc    Upload and verify driver license & national ID
// @access  Private (Renter)
router.post("/upload-documents", protect, authorize("renter"), uploadDocuments);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", protect, updateProfile);

module.exports = router;
