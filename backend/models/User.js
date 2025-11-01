const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["renter", "staff", "admin"],
      default: "renter",
    },

    // Personal Info
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },

    // For Renters - Verification Documents
    driverLicense: {
      number: String,
      images: [String],
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    nationalId: {
      number: String,
      images: [String],
      verified: { type: Boolean, default: false },
    },

    // For Staff - Station Assignment
    assignedStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
    },

    // Risk Assessment (for Admin)
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    violationCount: {
      type: Number,
      default: 0,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
