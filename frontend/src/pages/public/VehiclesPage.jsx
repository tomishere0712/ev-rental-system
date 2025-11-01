import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Filter, Battery, MapPin, Car } from "lucide-react";
import { vehicleService } from "../../services";
import toast from "react-hot-toast";

const VehiclesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    type: searchParams.get("type") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    minBattery: searchParams.get("minBattery") || "",
    station: searchParams.get("station") || "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const vehicleTypes = ["Scooter", "Motorcycle", "Car", "Bike"];

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await vehicleService.getVehicles(params);
      setVehicles(response.data.vehicles);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.totalPages,
      }));
    } catch (error) {
      toast.error("Không thể tải danh sách xe");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));

    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "",
      minPrice: "",
      maxPrice: "",
      minBattery: "",
      station: "",
    });
    setSearchParams({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Danh sách xe điện
          </h1>
          <p className="text-gray-600">Tìm xe phù hợp với nhu cầu của bạn</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Bộ lọc
                </h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Xóa
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    placeholder="Tên xe, model..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại xe
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Tất cả</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá thuê (VNĐ/giờ)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) =>
                      handleFilterChange("minPrice", e.target.value)
                    }
                    placeholder="Từ"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange("maxPrice", e.target.value)
                    }
                    placeholder="Đến"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Battery */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pin tối thiểu (%)
                </label>
                <input
                  type="number"
                  value={filters.minBattery}
                  onChange={(e) =>
                    handleFilterChange("minBattery", e.target.value)
                  }
                  placeholder="0-100"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={fetchVehicles}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </aside>

          {/* Vehicle Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
                  >
                    <div className="h-48 bg-gray-300"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Không tìm thấy xe
                </h3>
                <p className="text-gray-600 mb-4">
                  Thử thay đổi bộ lọc hoặc tìm kiếm khác
                </p>
                <button
                  onClick={clearFilters}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-gray-600">
                  Tìm thấy {pagination.total} xe
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vehicles.map((vehicle) => (
                    <Link
                      key={vehicle._id}
                      to={`/vehicles/${vehicle._id}`}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      <div className="relative h-48 bg-gray-200">
                        {vehicle.images && vehicle.images[0] ? (
                          <img
                            src={vehicle.images[0]}
                            alt={vehicle.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-16 h-16 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              vehicle.status === "available"
                                ? "bg-green-100 text-green-800"
                                : vehicle.status === "rented"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {vehicle.status === "available"
                              ? "Sẵn sàng"
                              : vehicle.status === "rented"
                              ? "Đang thuê"
                              : "Bảo trì"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {vehicle.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {vehicle.type} • {vehicle.model}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Battery className="w-4 h-4 mr-2 text-primary-600" />
                            <span>
                              Pin: {vehicle.batteryCapacity}% • {vehicle.range}
                              km
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-primary-600" />
                            <span>
                              {vehicle.currentStation?.name || "Đang cập nhật"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div>
                            <div className="text-2xl font-bold text-primary-600">
                              {vehicle.pricePerHour?.toLocaleString("vi-VN")}đ
                            </div>
                            <div className="text-xs text-gray-500">/ giờ</div>
                          </div>
                          <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            Thuê ngay
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: Math.max(1, prev.page - 1),
                          }))
                        }
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>
                      <span className="px-4 py-2 text-gray-600">
                        Trang {pagination.page} / {pagination.totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: Math.min(prev.totalPages, prev.page + 1),
                          }))
                        }
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default VehiclesPage;
