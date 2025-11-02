const User = require("../models/User");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

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

    // Check if email exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Check if phone exists
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res
          .status(400)
          .json({ message: "Số điện thoại đã được sử dụng" });
      }
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
        verificationStatus: user.verificationStatus,
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
        verificationStatus: user.verificationStatus,
        verificationNote: user.verificationNote,
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
    if (!req.files || (!req.files.driverLicense && !req.files.nationalId)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng upload đầy đủ 2 giấy tờ",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    // Kiểm tra nếu đang pending thì không cho upload lại
    if (user.verificationStatus === "pending") {
      return res.status(400).json({
        success: false,
        message: "Hồ sơ đang được xét duyệt. Vui lòng chờ kết quả.",
      });
    }

    // Upload driver license to Cloudinary
    if (req.files.driverLicense) {
      const driverLicenseImages = [];
      const files = Array.isArray(req.files.driverLicense)
        ? req.files.driverLicense
        : [req.files.driverLicense];

      for (const file of files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "ev-rental/driver-licenses",
          resource_type: "image",
        });
        driverLicenseImages.push(result.secure_url);

        // Delete temporary file
        fs.unlinkSync(file.path);
      }

      user.driverLicense = {
        number: req.body.driverLicenseNumber || "",
        images: driverLicenseImages,
        verified: false,
      };
    }

    // Upload national ID to Cloudinary
    if (req.files.nationalId) {
      const nationalIdImages = [];
      const files = Array.isArray(req.files.nationalId)
        ? req.files.nationalId
        : [req.files.nationalId];

      for (const file of files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "ev-rental/national-ids",
          resource_type: "image",
        });
        nationalIdImages.push(result.secure_url);

        // Delete temporary file
        fs.unlinkSync(file.path);
      }

      user.nationalId = {
        number: req.body.nationalIdNumber || "",
        images: nationalIdImages,
        verified: false,
      };
    }

    // Set verification status to pending
    user.verificationStatus = "pending";
    user.verificationNote = "";

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(user._id).select("-password");

    res.json({
      success: true,
      message: "Upload giấy tờ thành công! Đang chờ xét duyệt.",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Upload documents error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
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

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin mật khẩu",
      });
    }

    // Check password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    // Check if new password is same as old password
    const isSameAsOld = await user.comparePassword(newPassword);
    if (isSameAsOld) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới không được trùng với mật khẩu cũ",
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đổi mật khẩu",
    });
  }
};
