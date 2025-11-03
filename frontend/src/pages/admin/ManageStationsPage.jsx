import { useState, useEffect } from "react";
import { adminService } from "../../services";
import { MapPin, Plus, Edit, Trash2, Search, Car } from "lucide-react";
import toast from "react-hot-toast";

const ManageStationsPage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    code: "",
    phone: "",
    coordinates: { lat: "", lng: "" },
    operatingHours: { open: "08:00", close: "20:00" },
    totalParkingSpots: "",
    chargingStations: "",
  });

  const formatAddress = (addr) => {
    if (!addr) return "N/A";
    if (typeof addr === "string") return addr;
    const parts = [
      addr.street,
      addr.ward,
      addr.district,
      addr.city,
      addr.country,
    ];
    return parts.filter(Boolean).join(", ");
  };

  const formatOperatingHours = (oh) => {
    if (!oh) return "N/A";
    // shape 1: { open, close }
    if (oh.open && oh.close) return `${oh.open} - ${oh.close}`;

    // shape 2: per-day object: pick monday or first available day
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    for (const d of days) {
      if (oh[d] && (oh[d].open || oh[d].close)) {
        return `${oh[d].open || ""} - ${oh[d].close || ""}`;
      }
    }

    return "N/A";
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllStations();
      // backend returns { success: true, data: [...] }
      const stationsArray =
        res?.data || res?.stations || (Array.isArray(res) ? res : []);

      setStations(Array.isArray(stationsArray) ? stationsArray : []);
    } catch (error) {
      console.error("Error fetching stations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert operatingHours from { open, close } to per-day format
    const operatingHoursPerDay = {
      monday: {
        open: formData.operatingHours.open,
        close: formData.operatingHours.close,
      },
      tuesday: {
        open: formData.operatingHours.open,
        close: formData.operatingHours.close,
      },
      wednesday: {
        open: formData.operatingHours.open,
        close: formData.operatingHours.close,
      },
      thursday: {
        open: formData.operatingHours.open,
        close: formData.operatingHours.close,
      },
      friday: {
        open: formData.operatingHours.open,
        close: formData.operatingHours.close,
      },
      saturday: {
        open: formData.operatingHours.open,
        close: formData.operatingHours.close,
      },
      sunday: {
        open: formData.operatingHours.open,
        close: formData.operatingHours.close,
      },
    };

    const payload = {
      name: formData.name,
      code: formData.code,
      phone: formData.phone,
      address: {
        street: formData.address,
        city: formData.city,
      },
      coordinates: {
        lat: parseFloat(formData.coordinates.lat),
        lng: parseFloat(formData.coordinates.lng),
      },
      operatingHours: operatingHoursPerDay,
      totalParkingSpots: parseInt(formData.totalParkingSpots),
      chargingStations: parseInt(formData.chargingStations),
    };

    try {
      if (editingStation) {
        await adminService.updateStation(editingStation._id, payload);
        toast.success("Station updated successfully!");
      } else {
        await adminService.createStation(payload);
        toast.success("Station created successfully!");
      }

      fetchStations();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save station");
    }
  };

  const handleEdit = (station) => {
    setEditingStation(station);
    setFormData({
      name: station.name,
      // station.address may be an object: map to form fields
      address: station.address?.street || "",
      city: station.address?.city || "",
      code: station.code || "",
      phone: station.phone,
      coordinates: {
        lat: station.coordinates?.lat?.toString() || "",
        lng: station.coordinates?.lng?.toString() || "",
      },
      operatingHours: station.operatingHours || {
        open: "08:00",
        close: "20:00",
      },
      totalParkingSpots: (
        station.totalParkingSpots ||
        station.capacity ||
        ""
      ).toString(),
      chargingStations: (station.chargingStations || "").toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (stationId) => {
    if (!confirm("Are you sure you want to delete this station?")) return;

    try {
      await adminService.deleteStation(stationId);
      toast.success("Station deleted successfully!");
      fetchStations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete station");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStation(null);
    setFormData({
      name: "",
      address: "",
      city: "",
      code: "",
      phone: "",
      coordinates: { lat: "", lng: "" },
      operatingHours: { open: "08:00", close: "20:00" },
      totalParkingSpots: "",
      chargingStations: "",
    });
  };

  const filteredStations = stations.filter((station) => {
    const q = searchQuery.toLowerCase();
    const nameMatches = station.name?.toLowerCase().includes(q);
    const cityMatches = station.address?.city
      ? station.address.city.toLowerCase().includes(q)
      : false;
    const addressStr = formatAddress(station.address).toLowerCase();
    const addressMatches = addressStr.includes(q);
    return nameMatches || cityMatches || addressMatches;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Manage Stations</h1>
          <p className="text-gray-600 mt-2">
            View and manage all rental stations
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Station
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, city, or address..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStations.map((station) => (
          <div
            key={station._id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {station.name}
                    </h3>
                    <p className="text-sm text-gray-600">{station.city}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatAddress(station.address)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {station.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Operating Hours</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatOperatingHours(station.operatingHours)}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Total Parking Spots</p>
                    <p className="text-lg font-bold text-blue-600">
                      {station.totalParkingSpots ?? station.capacity ?? 0}{" "}
                      vehicles
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Car className="w-4 h-4" />
                      <span>{station.vehicleCount || 0} current</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => handleEdit(station)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(station._id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {editingStation ? "Edit Station" : "Add New Station"}
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
                    Station Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Station Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Parking Spots *
                  </label>
                  <input
                    type="number"
                    value={formData.totalParkingSpots}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalParkingSpots: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Charging Stations *
                </label>
                <input
                  type="number"
                  value={formData.chargingStations}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chargingStations: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.coordinates.lat}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coordinates: {
                          ...formData.coordinates,
                          lat: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.coordinates.lng}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coordinates: {
                          ...formData.coordinates,
                          lng: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Time *
                  </label>
                  <input
                    type="time"
                    value={formData.operatingHours.open}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operatingHours: {
                          ...formData.operatingHours,
                          open: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closing Time *
                  </label>
                  <input
                    type="time"
                    value={formData.operatingHours.close}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operatingHours: {
                          ...formData.operatingHours,
                          close: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingStation ? "Update Station" : "Add Station"}
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
    </div>
  );
};

export default ManageStationsPage;
