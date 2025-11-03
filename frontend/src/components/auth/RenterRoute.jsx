import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

const RenterRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);

  // Nếu không đăng nhập, cho phép xem (có thể chuyển đến trang đăng nhập sau)
  if (!user) {
    return children;
  }

  // Nếu là staff hoặc admin, chuyển hướng về trang chủ
  if (user.role === "staff" || user.role === "admin") {
    toast.error("Bạn không có quyền truy cập trang này");
    return <Navigate to="/" replace />;
  }

  // Cho phép renter và người chưa đăng nhập xem
  return children;
};

RenterRoute.propTypes = {
  children: PropTypes.node.isRequired
};

export default RenterRoute;