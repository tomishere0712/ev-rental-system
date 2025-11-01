const User = require("../models/User");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, fullName, phone, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      fullName,
      phone,
      role: role || "renter", // Default role is renter
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    // Check user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Tài khoản đã bị khóa" });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        driverLicense: user.driverLicense,
        nationalId: user.nationalId,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload verification documents
// @route   POST /api/auth/upload-documents
// @access  Private (Renter)
exports.uploadDocuments = async (req, res) => {
  try {
    const { driverLicenseNumber, nationalIdNumber } = req.body;

    if (!req.files || (!req.files.driverLicense && !req.files.nationalId)) {
      return res.status(400).json({ message: "Vui lòng upload giấy tờ" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Upload driver license images to Cloudinary
    if (req.files.driverLicense) {
      const driverLicenseImages = [];
      const files = Array.isArray(req.files.driverLicense)
        ? req.files.driverLicense
        : [req.files.driverLicense];

      for (const file of files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "ev-rental/driver-licenses",
        });
        driverLicenseImages.push(result.secure_url);
      }

      user.driverLicense = {
        number: driverLicenseNumber,
        images: driverLicenseImages,
        verified: false,
      };
    }

    // Upload national ID images to Cloudinary
    if (req.files.nationalId) {
      const nationalIdImages = [];
      const files = Array.isArray(req.files.nationalId)
        ? req.files.nationalId
        : [req.files.nationalId];

      for (const file of files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "ev-rental/national-ids",
        });
        nationalIdImages.push(result.secure_url);
      }

      user.nationalId = {
        number: nationalIdNumber,
        images: nationalIdImages,
        verified: false,
      };
    }

    await user.save();

    res.json({
      success: true,
      message: "Upload giấy tờ thành công. Chờ nhân viên xác thực.",
      data: {
        driverLicense: user.driverLicense,
        nationalId: user.nationalId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;

    // Upload avatar if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "ev-rental/avatars",
      });
      user.avatar = result.secure_url;
    }

    await user.save();

    res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
