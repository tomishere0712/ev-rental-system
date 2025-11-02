// Role-based authorization middleware
exports.isStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Không được xác thực" });
  }

  if (req.user.role !== "staff" && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Truy cập bị từ chối. Chỉ nhân viên." });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    console.error("User not found in request");
    return res.status(401).json({ message: "Không được xác thực" });
  }

  console.log("isAdmin check - User role:", req.user.role);

  if (req.user.role !== "admin") {
    console.error(
      `Access denied - Expected role 'admin', got '${req.user.role}'`
    );
    return res
      .status(403)
      .json({ message: "Truy cập bị từ chối. Chỉ quản trị viên." });
  }
  next();
};

exports.isStaffOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Không được xác thực" });
  }

  if (req.user.role !== "staff" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Truy cập bị từ chối." });
  }
  next();
};
