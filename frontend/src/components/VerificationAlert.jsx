import { Link } from "react-router-dom";
import { AlertCircle, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const VerificationAlert = () => {
  const { user } = useAuthStore();

  // Chỉ hiển thị cho renter chưa được xác thực
  if (!user || user.role !== "renter" || user.verificationStatus === "approved") {
    return null;
  }

  const alerts = {
    none: {
      bg: "bg-yellow-50",
      border: "border-yellow-400",
      icon: <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />,
      titleColor: "text-yellow-900",
      textColor: "text-yellow-800",
      buttonBg: "bg-yellow-600 hover:bg-yellow-700",
      title: "Tài khoản chưa được xác thực",
      message: "Vui lòng upload Giấy phép lái xe và CMND/CCCD để có thể đặt xe.",
      buttonText: "Xác thực ngay",
    },
    pending: {
      bg: "bg-blue-50",
      border: "border-blue-400",
      icon: <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />,
      titleColor: "text-blue-900",
      textColor: "text-blue-800",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
      title: "Hồ sơ đang được xét duyệt",
      message: "Quá trình xét duyệt có thể mất 24-48 giờ. Bạn sẽ nhận được thông báo khi có kết quả.",
      buttonText: "Xem chi tiết",
    },
    rejected: {
      bg: "bg-red-50",
      border: "border-red-400",
      icon: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
      titleColor: "text-red-900",
      textColor: "text-red-800",
      buttonBg: "bg-red-600 hover:bg-red-700",
      title: "Hồ sơ xác thực bị từ chối",
      message: user?.verificationNote || "Giấy tờ không hợp lệ. Vui lòng upload lại giấy tờ hợp lệ.",
      buttonText: "Upload lại",
    },
  };

  const status = user?.verificationStatus || "none";
  const alert = alerts[status];

  if (!alert) return null;

  return (
    <div className={`${alert.bg} border ${alert.border} rounded-lg p-4 mb-6`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {alert.icon}
          <div className="flex-1">
            <h3 className={`${alert.titleColor} font-semibold mb-1`}>
              {alert.title}
            </h3>
            <p className={`${alert.textColor} text-sm`}>
              {alert.message}
            </p>
          </div>
        </div>
        <Link
          to="/renter/profile"
          className={`${alert.buttonBg} text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap text-sm`}
        >
          {alert.buttonText}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default VerificationAlert;
