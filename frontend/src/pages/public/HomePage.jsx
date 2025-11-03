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
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b-4 border-amber-400 shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="bg-amber-100 p-3 rounded-full">
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-amber-900 font-bold text-lg mb-1.5">
                        🔐 Tài khoản chưa được xác thực
                      </h3>
                      <p className="text-amber-800 text-sm leading-relaxed">
                        Upload <strong>Giấy phép lái xe</strong> và <strong>CMND/CCCD</strong> để trải nghiệm đầy đủ dịch vụ thuê xe điện.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/renter/profile"
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
                  >
                    Xác thực ngay
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Đang chờ xét duyệt */}
          {user.verificationStatus === "pending" && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-4 border-blue-400 shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="bg-blue-100 p-3 rounded-full animate-pulse">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-blue-900 font-bold text-lg mb-1.5">
                        ⏳ Hồ sơ đang được xét duyệt
                      </h3>
                      <p className="text-blue-800 text-sm leading-relaxed">
                        Chúng tôi đang xem xét hồ sơ của bạn. Quá trình này thường mất <strong>24-48 giờ</strong>. Bạn sẽ nhận thông báo ngay khi có kết quả.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/renter/profile"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
                  >
                    Xem chi tiết
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Bị từ chối */}
          {user.verificationStatus === "rejected" && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-b-4 border-red-400 shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="bg-red-100 p-3 rounded-full">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-red-900 font-bold text-lg mb-1.5">
                        ❌ Hồ sơ xác thực bị từ chối
                      </h3>
                      <p className="text-red-800 text-sm mb-2 leading-relaxed">
                        <strong>Lý do:</strong> {user.verificationNote || "Giấy tờ không hợp lệ hoặc không rõ ràng."}
                      </p>
                      <p className="text-red-700 text-sm font-medium">
                        💡 Vui lòng kiểm tra và upload lại giấy tờ hợp lệ, rõ nét.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/renter/profile"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
                  >
                    Upload lại
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white overflow-hidden">
        {/* Animated background pattern with battery and lightning */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl animate-bounce">⚡</div>
          <div className="absolute top-20 right-20 text-6xl animate-pulse delay-300">🔋</div>
          <div className="absolute bottom-20 left-1/4 text-7xl animate-bounce delay-500">🚗</div>
          <div className="absolute top-1/3 right-1/3 text-5xl animate-pulse delay-700">⚡</div>
          <div className="absolute bottom-1/4 right-1/4 text-6xl animate-bounce delay-1000">🔋</div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full mb-6 border border-white/30">
              <Battery className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-semibold">100% Điện</span>
              
              <span className="text-sm font-semibold">0% Khí thải</span>
              <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
              <span className="flex items-center justify-center gap-3 flex-wrap">
                <span>Thuê xe điện</span>
              </span>
              <span className="text-green-200 flex items-center justify-center gap-2 mt-2">
                Thông minh & Xanh
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-green-50 max-w-3xl mx-auto leading-relaxed">
              Di chuyển thông minh với năng lượng sạch <span className="text-yellow-300">⚡</span> - 
              Pin đầy đủ <span className="text-yellow-300">🔋</span> - 
              Xe chất lượng <span className="text-green-200">🚗</span>
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-8">
              <div className="bg-white rounded-2xl shadow-2xl p-3 flex gap-3 transform hover:scale-105 transition-transform">
                <div className="flex-1 flex items-center px-4 bg-gray-50 rounded-xl">
                  <Search className="w-5 h-5 text-green-600 mr-3" />
                  <input
                    type="text"
                    placeholder="Tìm xe điện: Tesla, VinFast, scooter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-4 text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  Tìm ngay
                </button>
              </div>
            </form>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/vehicles"
                className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold hover:bg-green-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Car className="w-5 h-5" />
                Xem tất cả xe 
              </Link>
              <Link
                to="/stations"
                className="bg-green-500/20 backdrop-blur-sm border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-green-500/30 transition-all flex items-center gap-2"
              >
                <Battery className="w-5 h-5" />
                Trạm sạc 
              </Link>
            </div>

            {/* Feature highlights */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-4xl mb-2">⚡</div>
                <div className="font-bold text-lg">Sạc nhanh</div>
                <div className="text-green-100 text-sm">30 phút đầy pin</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-4xl mb-2">🔋</div>
                <div className="font-bold text-lg">Pin bền bỉ</div>
                <div className="text-green-100 text-sm">Quãng đường xa</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-4xl mb-2">🚗</div>
                <div className="font-bold text-lg">Xe hiện đại</div>
                <div className="text-green-100 text-sm">An toàn & tiện nghi</div>
              </div>
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
      <section className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white py-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 text-9xl animate-pulse">⚡</div>
          <div className="absolute bottom-10 left-10 text-9xl animate-bounce">🔋</div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl opacity-5">🚗</div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/30 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          

          {/* Title with emoji */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
            <span className="flex items-center justify-center gap-3 flex-wrap">
              <span>🌱</span>
              <span>Bắt đầu hành trình xanh</span>
            </span>
            <span className="text-green-200 block mt-2">
              của bạn ngay hôm nay
            </span>
          </h2>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
              <div className="text-3xl font-bold text-yellow-300">10,000+</div>
              <div className="text-green-100 text-sm">Khách hàng tin tưởng</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
              <div className="text-3xl font-bold text-yellow-300">50+</div>
              <div className="text-green-100 text-sm">Loại xe đa dạng</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
              <div className="text-3xl font-bold text-yellow-300">24/7</div>
              <div className="text-green-100 text-sm">Hỗ trợ khách hàng</div>
            </div>
          </div>

          <p className="text-xl md:text-2xl text-green-50 mb-10 max-w-3xl mx-auto">
            Tham gia cộng đồng di chuyển xanh <span className="text-yellow-300">⚡</span> - 
            Tiết kiệm chi phí <span className="text-yellow-300">💰</span> - 
            Bảo vệ môi trường <span className="text-green-200">🌍</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link
              to="/register"
              className="group bg-white text-green-600 px-10 py-4 rounded-xl font-bold hover:bg-green-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2"
            >
              <span>Đăng ký miễn phí</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/vehicles"
              className="group bg-green-500/20 backdrop-blur-sm border-2 border-white text-white px-10 py-4 rounded-xl font-bold hover:bg-white/30 transition-all flex items-center gap-2"
            >
              <Car className="w-5 h-5" />
              <span>Khám phá xe điện</span>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-green-100 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Bảo mật an toàn</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span>Đăng ký nhanh chóng</span>
            </div>
            <div className="flex items-center gap-2">
              <Battery className="w-5 h-5" />
              <span>100% thân thiện môi trường</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
