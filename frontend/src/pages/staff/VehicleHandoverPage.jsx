import { useState } from "react";
import { staffService } from "../../services";
import {
  Search,
  Upload,
  Car,
  User,
  Calendar,
  Battery,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const VehicleHandoverPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [handoverType, setHandoverType] = useState("pickup"); // pickup or return
  const [processing, setProcessing] = useState(false);

  // Pickup form state
  const [pickupPhotos, setPickupPhotos] = useState([]);
  const [pickupBattery, setPickupBattery] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");

  // Return form state
  const [returnPhotos, setReturnPhotos] = useState([]);
  const [returnBattery, setReturnBattery] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [lateFees, setLateFees] = useState(0);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const bookings = await staffService.getBookings({ search: searchQuery });
      console.log("Search results:", bookings);

      // Filter bookings that can be processed (pending/approved for pickup, active for return)
      const processableBookings = bookings.filter(
        (b) =>
          b.status === "pending" ||
          b.status === "approved" ||
          b.status === "active"
      );

      if (processableBookings.length > 0) {
        const foundBooking = processableBookings[0]; // Take first processable booking
        setBooking(foundBooking);

        // Determine handover type based on booking status
        if (
          foundBooking.status === "pending" ||
          foundBooking.status === "approved"
        ) {
          setHandoverType("pickup");
        } else if (foundBooking.status === "active") {
          setHandoverType("return");
          // Calculate late fees if overdue
          const endDate = new Date(foundBooking.endDate);
          const today = new Date();
          if (today > endDate) {
            const daysLate = Math.ceil(
              (today - endDate) / (1000 * 60 * 60 * 24)
            );
            const dailyRate = foundBooking.vehicle?.pricePerDay || 0;
            setLateFees(daysLate * dailyRate * 0.5); // 50% of daily rate as late fee
          }
        }
      } else {
        setError(
          "No pending/approved/active booking found with this search. Found " +
            bookings.length +
            " booking(s) but status is not processable."
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search booking");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e, type) => {
    const files = Array.from(e.target.files);
    const photoUrls = files.map((file) => URL.createObjectURL(file));

    if (type === "pickup") {
      setPickupPhotos([...pickupPhotos, ...photoUrls]);
    } else {
      setReturnPhotos([...returnPhotos, ...photoUrls]);
    }
  };

  const handlePickup = async () => {
    if (!booking || !pickupBattery) {
      alert("Please fill in all required fields");
      return;
    }

    setProcessing(true);
    try {
      await staffService.handoverVehicle(booking._id, {
        pickupPhotos: pickupPhotos, // In real app, upload to cloudinary first
        pickupBatteryLevel: parseFloat(pickupBattery),
        pickupNotes: pickupNotes,
        signature: "digital_signature_data", // In real app, capture actual signature
      });

      alert("Vehicle handed over successfully!");
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to process handover");
    } finally {
      setProcessing(false);
    }
  };

  const handleReturn = async () => {
    if (!booking || !returnBattery) {
      alert("Please fill in all required fields");
      return;
    }

    setProcessing(true);
    try {
      await staffService.returnVehicle(booking._id, {
        returnPhotos: returnPhotos,
        returnBatteryLevel: parseFloat(returnBattery),
        returnNotes: returnNotes,
        lateFees: lateFees,
      });

      alert("Vehicle return processed successfully!");
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to process return");
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setBooking(null);
    setPickupPhotos([]);
    setPickupBattery("");
    setPickupNotes("");
    setReturnPhotos([]);
    setReturnBattery("");
    setReturnNotes("");
    setLateFees(0);
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: "bg-green-100 text-green-800",
      active: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Handover</h1>
        <p className="text-gray-600 mt-2">Process vehicle pickup and return</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter booking number or customer email..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Booking Details and Handover Form */}
      {booking && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">
                {handoverType === "pickup"
                  ? "Vehicle Pickup"
                  : "Vehicle Return"}
              </h2>
              <span
                className={`px-4 py-1 rounded-full text-sm font-semibold ${getStatusBadge(
                  booking.status
                )}`}
              >
                {booking.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer & Vehicle Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Customer
                  </h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-600">Name:</span>{" "}
                    <span className="font-medium">
                      {booking.user?.fullName}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Email:</span>{" "}
                    <span className="font-medium">{booking.user?.email}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Phone:</span>{" "}
                    <span className="font-medium">{booking.user?.phone}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">License:</span>{" "}
                    <span className="font-medium">
                      {booking.user?.licenseNumber}
                    </span>
                  </p>
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Vehicle
                  </h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-600">Model:</span>{" "}
                    <span className="font-medium">
                      {booking.vehicle?.brand} {booking.vehicle?.model}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">License:</span>{" "}
                    <span className="font-medium">
                      {booking.vehicle?.licensePlate}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Color:</span>{" "}
                    <span className="font-medium capitalize">
                      {booking.vehicle?.color}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Range:</span>{" "}
                    <span className="font-medium">
                      {booking.vehicle?.range} km
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Dates */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Booking Period
                </h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg flex justify-between">
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="text-base font-medium">
                    {new Date(booking.startDate).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="text-base font-medium">
                    {new Date(booking.endDate).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-xl font-bold text-green-600">
                    ${booking.totalAmount}
                  </p>
                </div>
              </div>
            </div>

            {/* Handover Type Toggle */}
            {booking.status === "approved" && handoverType === "pickup" && (
              <>
                {/* Pickup Form */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Vehicle Pickup Process
                  </h3>

                  <div className="space-y-4">
                    {/* Battery Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Battery className="w-4 h-4 inline mr-1" />
                        Current Battery Level (%) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pickupBattery}
                        onChange={(e) => setPickupBattery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Upload className="w-4 h-4 inline mr-1" />
                        Vehicle Photos (Damage inspection)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handlePhotoUpload(e, "pickup")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {pickupPhotos.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {pickupPhotos.map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={`Pickup ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={pickupNotes}
                        onChange={(e) => setPickupNotes(e.target.value)}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Any observations about the vehicle condition..."
                      />
                    </div>

                    <button
                      onClick={handlePickup}
                      disabled={processing || !pickupBattery}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {processing ? "Processing..." : "Complete Pickup"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {booking.status === "active" && handoverType === "return" && (
              <>
                {/* Return Form */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Vehicle Return Process
                  </h3>

                  {lateFees > 0 && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Late Return Detected
                        </p>
                        <p className="text-sm text-yellow-700">
                          Additional late fees:{" "}
                          <span className="font-bold">
                            ${lateFees.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Battery Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Battery className="w-4 h-4 inline mr-1" />
                        Current Battery Level (%) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={returnBattery}
                        onChange={(e) => setReturnBattery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Upload className="w-4 h-4 inline mr-1" />
                        Vehicle Photos (Return inspection)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handlePhotoUpload(e, "return")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {returnPhotos.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {returnPhotos.map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={`Return ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes & Damage Report
                      </label>
                      <textarea
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Document any damage or issues found..."
                      />
                    </div>

                    <button
                      onClick={handleReturn}
                      disabled={processing || !returnBattery}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {processing ? "Processing..." : "Complete Return"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {booking.status !== "approved" && booking.status !== "active" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  This booking cannot be processed. Status:{" "}
                  <span className="font-semibold">{booking.status}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      {!booking && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800">
            Search for a booking to process vehicle pickup (approved bookings)
            or return (active rentals).
          </p>
        </div>
      )}
    </div>
  );
};

export default VehicleHandoverPage;
