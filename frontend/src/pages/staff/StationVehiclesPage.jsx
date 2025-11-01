import { useState, useEffect } from "react";
import { staffService } from "../../services";
import {
  Car,
  Battery,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

const StationVehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showBatteryModal, setShowBatteryModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueSeverity, setIssueSeverity] = useState("minor");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await staffService.getStationVehicles(
        filter !== "all" ? filter : undefined
      );
      setVehicles(data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBattery = async () => {
    if (!selectedVehicle || !batteryLevel) return;

    setSubmitting(true);
    try {
      await staffService.updateVehicleBattery(
        selectedVehicle._id,
        parseFloat(batteryLevel)
      );
      alert("Battery level updated successfully");
      setShowBatteryModal(false);
      setBatteryLevel("");
      setSelectedVehicle(null);
      fetchVehicles();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update battery level");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportIssue = async () => {
    if (!selectedVehicle || !issueDescription) return;

    setSubmitting(true);
    try {
      await staffService.reportVehicleIssue(selectedVehicle._id, {
        description: issueDescription,
        severity: issueSeverity,
      });
      alert("Issue reported successfully");
      setShowIssueModal(false);
      setIssueDescription("");
      setIssueSeverity("minor");
      setSelectedVehicle(null);
      fetchVehicles();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to report issue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (vehicle) => {
    const newStatus =
      vehicle.status === "available" ? "unavailable" : "available";

    try {
      await staffService.updateVehicleStatus(vehicle._id, newStatus);
      alert(`Vehicle status updated to ${newStatus}`);
      fetchVehicles();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update vehicle status");
    }
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

  const getBatteryColor = (level) => {
    if (level >= 80) return "text-green-600";
    if (level >= 50) return "text-yellow-600";
    if (level >= 20) return "text-orange-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Station Vehicles</h1>
        <p className="text-gray-600 mt-2">Manage vehicles at your station</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b">
          {["all", "available", "rented", "maintenance", "unavailable"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-6 py-3 font-medium capitalize ${
                  filter === tab
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab} (
                {
                  vehicles.filter((v) => tab === "all" || v.status === tab)
                    .length
                }
                )
              </button>
            )
          )}
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle._id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Vehicle Image */}
            <div className="h-48 bg-gray-200 relative">
              {vehicle.images && vehicle.images[0] ? (
                <img
                  src={vehicle.images[0]}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                    vehicle.status
                  )}`}
                >
                  {vehicle.status}
                </span>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-sm text-gray-600 mb-3">{vehicle.year}</p>

              {/* Battery Level */}
              <div className="flex items-center gap-2 mb-3">
                <Battery
                  className={`w-5 h-5 ${getBatteryColor(vehicle.batteryLevel)}`}
                />
                <span
                  className={`text-sm font-medium ${getBatteryColor(
                    vehicle.batteryLevel
                  )}`}
                >
                  {vehicle.batteryLevel}% Battery
                </span>
              </div>

              {/* Vehicle Details */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">Range:</span>
                  <span className="ml-1 font-medium">{vehicle.range} km</span>
                </div>
                <div>
                  <span className="text-gray-600">Price:</span>
                  <span className="ml-1 font-medium">
                    ${vehicle.pricePerDay}/day
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">License:</span>
                  <span className="ml-1 font-medium">
                    {vehicle.licensePlate}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Color:</span>
                  <span className="ml-1 font-medium capitalize">
                    {vehicle.color}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setBatteryLevel(vehicle.batteryLevel.toString());
                    setShowBatteryModal(true);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Battery className="w-4 h-4" />
                  Update Battery
                </button>
                <button
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setShowIssueModal(true);
                  }}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Report Issue
                </button>
                <button
                  onClick={() => handleStatusToggle(vehicle)}
                  disabled={vehicle.status === "rented"}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    vehicle.status === "available"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : vehicle.status === "rented"
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {vehicle.status === "available" ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      Mark Unavailable
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Mark Available
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {vehicles.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No vehicles found at your station</p>
        </div>
      )}

      {/* Battery Update Modal */}
      {showBatteryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Update Battery Level</h3>
            <p className="text-gray-600 mb-4">
              {selectedVehicle?.brand} {selectedVehicle?.model} -{" "}
              {selectedVehicle?.licensePlate}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Battery Level (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={batteryLevel}
                onChange={(e) => setBatteryLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpdateBattery}
                disabled={submitting || !batteryLevel}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Updating..." : "Update"}
              </button>
              <button
                onClick={() => {
                  setShowBatteryModal(false);
                  setBatteryLevel("");
                  setSelectedVehicle(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Report Vehicle Issue</h3>
            <p className="text-gray-600 mb-4">
              {selectedVehicle?.brand} {selectedVehicle?.model} -{" "}
              {selectedVehicle?.licensePlate}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Description
              </label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the issue..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={issueSeverity}
                onChange={(e) => setIssueSeverity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReportIssue}
                disabled={submitting || !issueDescription}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {submitting ? "Reporting..." : "Report Issue"}
              </button>
              <button
                onClick={() => {
                  setShowIssueModal(false);
                  setIssueDescription("");
                  setIssueSeverity("minor");
                  setSelectedVehicle(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationVehiclesPage;
