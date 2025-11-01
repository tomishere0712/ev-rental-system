import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services";
import toast from "react-hot-toast";
import { LogIn, Mail, Lock, Loader } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(formData);

      if (response.success) {
        const { token, ...user } = response.data;
        setAuth(user, token);
        toast.success("Đăng nhập thành công!");

        // Redirect based on role
        switch (user.role) {
          case "renter":
            navigate("/renter/dashboard");
            break;
          case "staff":
            navigate("/staff/dashboard");
            break;
          case "admin":
            navigate("/admin/dashboard");
            break;
          default:
            navigate("/");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">⚡</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">EV Rental</span>
          </Link>
          <p className="text-gray-600 mt-2">Thuê xe điện dễ dàng, tiện lợi</p>
        </div>

        {/* Login Form */}
        <div className="card">
          <h1 className="text-2xl font-bold text-center mb-6">Đăng nhập</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">
                <Lock className="w-4 h-4 inline mr-1" />
                Mật khẩu
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>

          {/* Demo Accounts */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center mb-2">
              Tài khoản demo:
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>👤 Renter: renter@demo.com / password123</p>
              <p>🏢 Staff: staff@demo.com / password123</p>
              <p>👨‍💼 Admin: admin@demo.com / password123</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
