import { Link } from "react-router-dom";
import { Car, MapPin, Shield, Clock, Battery, Zap, Search, AlertCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";

const HomePage = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");

  const features = [
    {
      icon: <Car className="w-8 h-8" />,
      title: "Đa dạng xe điện",
      description:
        "Nhiều loại xe từ scooter đến ô tô điện, phù hợp mọi nhu cầu",
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Nhiều điểm thuê",
      description: "Hệ thống điểm thuê rộng khắp thành phố, dễ dàng tìm kiếm",
    },
    {
      icon: <Battery className="w-8 h-8" />,
      title: "Pin đầy đủ",
      description: "Tất cả xe đều được sạc đầy pin trước khi bàn giao",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "An toàn & bảo hiểm",
      description: "Đầy đủ bảo hiểm, được kiểm tra kỹ lưỡng",
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Thuê linh hoạt",
      description: "Theo giờ, theo ngày hoặc theo tháng",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Đặt xe nhanh",
      description: "Chỉ vài phút để hoàn tất đặt xe online",
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/vehicles?search=${encodeURIComponent(
        searchQuery
      )}`;
    }
  };

  return (
    <div className="bg-white">
      {/* Verification Alert Banner */}
      {user && user.role === "renter" && (
        <>
          {/* Chưa upload giấy tờ */}
          {(!user.verificationStatus || user.verificationStatus === "none") && (
            <div className="bg-yellow-50 border-b-2 border-yellow-400">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-yellow-900 font-semibold text-lg mb-1">
                        Tài khoản chưa được xác thực
                      </h3>
                      <p className="text-yellow-800 text-sm">
                        Vui lòng upload <strong>Giấy phép lái xe</strong> và <strong>CMND/CCCD</strong> để có thể đặt xe và sử dụng đầy đủ dịch vụ.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/renter/profile"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    Xác thực ngay
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Đang chờ xét duyệt */}
          {user.verificationStatus === "pending" && (
            <div className="bg-blue-50 border-b-2 border-blue-400">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-blue-900 font-semibold text-lg mb-1">
                        Hồ sơ đang được xét duyệt
                      </h3>
                      <p className="text-blue-800 text-sm">
                        Chúng tôi đang xem xét hồ sơ của bạn. Quá trình này có thể mất <strong>24-48 giờ</strong>. Bạn sẽ nhận được thông báo khi có kết quả.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/renter/profile"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    Xem chi tiết
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Bị từ chối */}
          {user.verificationStatus === "rejected" && (
            <div className="bg-red-50 border-b-2 border-red-400">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-red-900 font-semibold text-lg mb-1">
                        Hồ sơ xác thực bị từ chối
                      </h3>
                      <p className="text-red-800 text-sm mb-2">
                        {user.verificationNote || "Giấy tờ không hợp lệ hoặc không rõ ràng. Vui lòng upload lại."}
                      </p>
                      <p className="text-red-700 text-sm font-medium">
                        Vui lòng kiểm tra và upload lại giấy tờ hợp lệ.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/renter/profile"
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    Upload lại
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Thuê xe điện thông minh
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Giải pháp di chuyển xanh, tiết kiệm và thân thiện môi trường
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-xl p-2 flex gap-2">
                <div className="flex-1 flex items-center px-4">
                  <Search className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Tìm xe điện: Tesla, VinFast, scooter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-3 text-gray-900 placeholder-gray-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-md font-semibold transition-colors"
                >
                  Tìm kiếm
                </button>
              </div>
            </form>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/vehicles"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Xem tất cả xe
              </Link>
              <Link
                to="/stations"
                className="bg-primary-500 bg-opacity-20 backdrop-blur-sm border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-opacity-30 transition-colors"
              >
                Tìm điểm thuê
              </Link>
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-16"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              fill="#ffffff"
            ></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tại sao chọn chúng tôi?
            </h2>
            <p className="text-xl text-gray-600">
              Trải nghiệm thuê xe điện hiện đại và tiện lợi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="text-primary-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cách thức hoạt động
            </h2>
            <p className="text-xl text-gray-600">
              Chỉ 4 bước đơn giản để thuê xe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Đăng ký tài khoản</h3>
              <p className="text-gray-600">Tạo tài khoản và xác thực giấy tờ</p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Chọn xe & điểm thuê
              </h3>
              <p className="text-gray-600">Tìm xe phù hợp gần bạn</p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Đặt xe online</h3>
              <p className="text-gray-600">Hoàn tất đặt xe chỉ vài phút</p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Nhận xe & khởi hành
              </h3>
              <p className="text-gray-600">Đến điểm thuê nhận xe và đi</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/register"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bắt đầu hành trình xanh của bạn ngay hôm nay
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Hơn 10,000+ khách hàng đã tin tưởng sử dụng dịch vụ của chúng tôi
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Đăng ký miễn phí
            </Link>
            <Link
              to="/vehicles"
              className="bg-primary-500 border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Khám phá xe
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
