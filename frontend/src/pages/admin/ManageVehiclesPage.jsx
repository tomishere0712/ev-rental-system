import { useState, useEffect } from "react";
import { adminService } from "../../services";
import {
  Car,
  Plus,
  Edit,
  Trash2,
  Search,
  Battery,
  MapPin,
  Truck,
} from "lucide-react";
import toast from "react-hot-toast";

const ManageVehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferVehicle, setTransferVehicle] = useState(null);
  const [transferStationId, setTransferStationId] = useState("");
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    licensePlate: "",
    type: "scooter",
    batteryCapacity: "",
    range: "",
    pricePerHour: "",
    pricePerDay: "",
    deposit: "",
    currentStation: "",
    status: "available",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehiclesData, stationsData] = await Promise.all([
        adminService.getAllVehicles(),
        adminService.getAllStations(),
      ]);
      // Unwrap vehicles response - backend returns { success, data: { vehicles: [...] } }
      const vehiclesArray = vehiclesData?.data?.vehicles || [];
      // Unwrap stations response
      const stationsArray =
        stationsData?.data ||
        stationsData?.stations ||
        (Array.isArray(stationsData) ? stationsData : []);

      setVehicles(Array.isArray(vehiclesArray) ? vehiclesArray : []);
      setStations(Array.isArray(stationsArray) ? stationsArray : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingVehicle) {
        await adminService.updateVehicle(editingVehicle._id, formData);
        toast.success("Vehicle updated successfully!");
      } else {
        await adminService.createVehicle(formData);
        toast.success("Vehicle created successfully!");
      }

      fetchData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save vehicle");
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      type: vehicle.type,
      batteryCapacity: vehicle.batteryCapacity,
      range: vehicle.range,
      pricePerHour: vehicle.pricePerHour,
      pricePerDay: vehicle.pricePerDay,
      deposit: vehicle.deposit,
      currentStation: vehicle.currentStation?._id || "",
      status: vehicle.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (vehicleId) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      await adminService.deleteVehicle(vehicleId);
      toast.success("Vehicle deleted successfully!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete vehicle");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
    setFormData({
      name: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      licensePlate: "",
      type: "scooter",
      batteryCapacity: "",
      range: "",
      pricePerHour: "",
      pricePerDay: "",
      deposit: "",
      currentStation: "",
      status: "available",
    });
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || vehicle.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const handleTransferClick = (vehicle) => {
    setTransferVehicle(vehicle);
    setTransferStationId(vehicle.currentStation?._id || "");
    setShowTransferModal(true);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferStationId) {
      alert("Vui lòng chọn trạm");
      return;
    }

    try {
      await adminService.transferVehicle(
        transferVehicle._id,
        transferStationId
      );
      toast.success("Đã chuyển xe thành công!");
      setShowTransferModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi chuyển xe");
    }
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setTransferVehicle(null);
    setTransferStationId("");
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: "bg-green-100 text-green-800",
      rented: "bg-blue-100 text-blue-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      unavailable: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Vehicles</h1>
          <p className="text-gray-600 mt-2">
            View and manage all electric vehicles
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by brand, model, or license plate..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  License Plate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Station
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Battery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price/Hour
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price/Day
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Deposit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Issues
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedVehicles.map((vehicle) => (
                <tr key={vehicle._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <Car className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {vehicle.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                      {vehicle.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {vehicle.licensePlate}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {vehicle.currentStation?.name || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Battery className="w-4 h-4 text-gray-400" />
                      {vehicle.currentBatteryLevel}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.range} km
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    ${vehicle.pricePerHour}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    ${vehicle.pricePerDay}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-orange-600">
                    ${vehicle.deposit}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                        vehicle.status
                      )}`}
                    >
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTransferClick(vehicle)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                        title="Transfer to Station"
                      >
                        <Truck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.currentIssues && vehicle.currentIssues.length > 0 ? (
                      <ul className="space-y-1">
                        {vehicle.currentIssues.map((issue, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${issue.severity === "low"
                                  ? "bg-green-100 text-green-800"
                                  : issue.severity === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                            >
                              {issue.severity}
                            </span>
                            <span>{issue.description}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">No issues</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredVehicles.length > 0 && (
          <div className="flex items-center justify-center mt-6 p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg ${page === currentPage
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {filteredVehicles.length === 0 && (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No vehicles found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Tesla Model 3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="scooter">Scooter</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="car">Car</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand *
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    value={formData.licensePlate}
                    onChange={(e) =>
                      setFormData({ ...formData, licensePlate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Battery Capacity (kWh) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.batteryCapacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        batteryCapacity: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Range (km) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.range}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        range: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Hour ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricePerHour}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerHour: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Day ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricePerDay}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerDay: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deposit ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.deposit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deposit: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Station *
                  </label>
                  <select
                    value={formData.currentStation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentStation: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Station</option>
                    {stations.map((station) => (
                      <option key={station._id} value={station._id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="available">Available</option>
                    <option value="rented">Rented</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="charging">Charging</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Vehicle Modal */}
      {showTransferModal && transferVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h3 className="text-xl font-semibold text-white">
                Chuyển Xe Sang Trạm Khác
              </h3>
              <button
                onClick={closeTransferModal}
                className="text-white hover:bg-purple-800 rounded-full p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransfer} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-1">Xe hiện tại:</p>
                <p className="text-lg font-semibold text-gray-900">
                  {transferVehicle.brand} {transferVehicle.model} (
                  {transferVehicle.licensePlate})
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Trạm hiện tại: {transferVehicle.currentStation?.name || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn Trạm Đích *
                </label>
                <select
                  value={transferStationId}
                  onChange={(e) => setTransferStationId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Chọn trạm --</option>
                  {stations.map((station) => (
                    <option key={station._id} value={station._id}>
                      {station.name} ({station.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  Chuyển Xe
                </button>
                <button
                  type="button"
                  onClick={closeTransferModal}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageVehiclesPage;
