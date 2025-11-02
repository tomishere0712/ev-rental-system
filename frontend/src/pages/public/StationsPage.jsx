import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { stationService } from "../../services";
import {
  MapPin,
  Search,
  Navigation,
  Car,
  Clock,
  Phone,
  Mail,
  ChevronRight,
  Loader,
} from "lucide-react";
import toast from "react-hot-toast";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom component to recenter map
// eslint-disable-next-line react/prop-types
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

const StationsPage = () => {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStation, setSelectedStation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([10.8231, 106.6297]); // Default: Ho Chi Minh City
  const mapRef = useRef(null);

  // Filter function - defined first
  const filterStations = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredStations(stations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = stations.filter((station) => {
      const addressStr = station.address
        ? `${station.address.street} ${station.address.district} ${station.address.city}`
        : "";
      return (
        station.name?.toLowerCase().includes(query) ||
        addressStr.toLowerCase().includes(query)
      );
    });
    setFilteredStations(filtered);
  }, [searchQuery, stations]);

  useEffect(() => {
    fetchStations();
    getUserLocation();
  }, []);

  useEffect(() => {
    filterStations();
  }, [searchQuery, stations, filterStations]);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await stationService.getStations({ limit: 100 });
      setStations(response.data.stations || []);
      setFilteredStations(response.data.stations || []);
    } catch (error) {
      toast.error("Không thể tải danh sách điểm thuê");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(location);
          setMapCenter(location);
        },
        (error) => {
          console.log("Geolocation error:", error);
          toast.error("Không thể lấy vị trí của bạn");
        }
      );
    }
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    if (station.coordinates) {
      const { lat, lng } = station.coordinates;
      setMapCenter([lat, lng]);
    }
  };

  const calculateDistance = (station) => {
    if (!userLocation || !station.coordinates) return null;

    const { lat, lng } = station.coordinates;
    const [userLat, userLng] = userLocation; // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = ((lat - userLat) * Math.PI) / 180;
    const dLon = ((lng - userLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance.toFixed(1);
  };

  const searchNearbyStations = async () => {
    if (!userLocation) {
      toast.error("Vui lòng cho phép truy cập vị trí");
      return;
    }

    try {
      setLoading(true);
      const [latitude, longitude] = userLocation;
      const response = await stationService.searchNearby({
        latitude,
        longitude,
        maxDistance: 10000,
      });
      setStations(response.data.stations || []);
      setFilteredStations(response.data.stations || []);
      toast.success(
        `Tìm thấy ${response.data.stations.length} điểm thuê gần bạn`
      );
    } catch (error) {
      toast.error("Không thể tìm điểm thuê gần bạn");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Điểm thuê xe điện
          </h1>
          <p className="text-gray-600">Tìm điểm thuê gần bạn trên bản đồ</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên điểm thuê, địa chỉ, thành phố..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={searchNearbyStations}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              <Navigation className="w-5 h-5" />
              Gần tôi
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stations List */}
          <div className="lg:col-span-1 space-y-4 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow-md p-4 animate-pulse"
                  >
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Không tìm thấy điểm thuê
                </h3>
                <p className="text-gray-600">Thử tìm kiếm với từ khóa khác</p>
              </div>
            ) : (
              filteredStations.map((station) => {
                const distance = calculateDistance(station);
                const isSelected = selectedStation?._id === station._id;

                return (
                  <div
                    key={station._id}
                    onClick={() => handleStationSelect(station)}
                    className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                      isSelected ? "ring-2 ring-primary-600" : ""
                    }`}
                  >
                    {/* Station Image */}
                    {station.images && station.images.length > 0 && (
                      <div className="relative h-48 w-full overflow-hidden bg-gray-200">
                        <img
                          src={station.images[0]}
                          alt={station.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/400x200?text=EV+Station";
                          }}
                        />
                        {distance && (
                          <div className="absolute top-2 right-2">
                            <span className="text-xs font-semibold text-white bg-primary-600 px-2 py-1 rounded-full shadow-lg">
                              {distance} km
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {station.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 flex items-start">
                            <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                            {station.address.street}, {station.address.district}
                          </p>
                        </div>
                        {!station.images && distance && (
                          <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                            {distance} km
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Car className="w-4 h-4 mr-2 text-primary-600" />
                          <span>{station.chargingStations} trạm sạc</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-primary-600" />
                          <span>24/7</span>
                        </div>
                      </div>

                      {station.phone && (
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Phone className="w-4 h-4 mr-2" />
                          {station.phone}
                        </div>
                      )}

                      {station.email && (
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <Mail className="w-4 h-4 mr-2" />
                          {station.email}
                        </div>
                      )}

                      <Link
                        to={`/vehicles?station=${station._id}`}
                        className="flex items-center justify-center w-full py-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg font-medium transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Xem xe tại đây
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-[600px]">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Loader className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
              ) : (
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  className="h-full w-full"
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterMap center={mapCenter} />

                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker
                      position={userLocation}
                      icon={L.divIcon({
                        className: "custom-div-icon",
                        html: `<div style="background-color: #10b981; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                      })}
                    >
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold">Vị trí của bạn</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Station Markers */}
                  {filteredStations.map((station) => {
                    if (!station.coordinates) return null;
                    const { lat, lng } = station.coordinates;
                    const distance = calculateDistance(station);

                    return (
                      <Marker
                        key={station._id}
                        position={[lat, lng]}
                        eventHandlers={{
                          click: () => handleStationSelect(station),
                        }}
                      >
                        <Popup>
                          <div className="min-w-[200px]">
                            <h3 className="font-semibold text-gray-900 mb-2">
                              {station.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {station.address.street},{" "}
                              {station.address.district}
                            </p>
                            {distance && (
                              <p className="text-sm text-primary-600 font-medium mb-2">
                                📍 {distance} km từ bạn
                              </p>
                            )}
                            <div className="text-sm text-gray-600 mb-3">
                              <p>⚡ {station.chargingStations} trạm sạc</p>
                              <p>🅿️ {station.totalParkingSpots} chỗ đỗ</p>
                              {station.phone && <p>📞 {station.phone}</p>}
                            </div>
                            <Link
                              to={`/vehicles?station=${station._id}`}
                              className="block text-center w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-medium transition-colors text-sm"
                            >
                              Xem xe
                            </Link>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationsPage;
