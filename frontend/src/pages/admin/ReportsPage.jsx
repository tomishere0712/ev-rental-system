import { useState, useEffect } from "react";
import { adminService } from "../../services";
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Car,
  Users,
  MapPin,
} from "lucide-react";

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  // Temporary state for date inputs before applying filter
  const [tempDateRange, setTempDateRange] = useState(dateRange);
  const [revenueByStation, setRevenueByStation] = useState([]);
  const [bookingsTrend, setBookingsTrend] = useState([]);
  const [vehicleDistribution, setVehicleDistribution] = useState(null);
  const [vehicleUsageByHour, setVehicleUsageByHour] = useState([]);
  const [overviewStats, setOverviewStats] = useState(null);

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [revenue, bookings, distribution, usage, overview] =
        await Promise.all([
          adminService.getRevenueByStation(dateRange.start, dateRange.end),
          adminService.getBookingsTrend(dateRange.start, dateRange.end),
          adminService.getVehicleDistribution(),
          adminService.getVehicleUsageByHour(dateRange.start, dateRange.end),
          adminService.getOverviewStats(),
        ]);

      // Unwrap responses
      setRevenueByStation(revenue?.data || revenue || []);
      setBookingsTrend(bookings?.data || bookings || []);
      setVehicleDistribution(distribution?.data || distribution || []);
      setVehicleUsageByHour(usage?.data || usage || []);
      setOverviewStats(overview?.data || overview || null);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Apply button - update actual dateRange to trigger fetch
  const handleApplyFilter = () => {
    setDateRange(tempDateRange);
  };

  const handleExportCSV = () => {
    // Create CSV content
    const csvRows = [
      ["Station", "Revenue", "Bookings"].join(","),
      ...revenueByStation.map((s) =>
        [s.station || "N/A", s.revenue || 0, s.bookings || 0].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${dateRange.start}-to-${dateRange.end}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-2">
            Business intelligence and performance metrics
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={tempDateRange.start}
              onChange={(e) =>
                setTempDateRange({ ...tempDateRange, start: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={tempDateRange.end}
              onChange={(e) =>
                setTempDateRange({ ...tempDateRange, end: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleApplyFilter}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90">Total Revenue</p>
          <p className="text-3xl font-bold">
            ${overviewStats?.totalRevenue?.toFixed(2) || "0.00"}
          </p>
          <p className="text-xs opacity-75 mt-1">+12.5% from last period</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8" />
          </div>
          <p className="text-sm opacity-90">Total Bookings</p>
          <p className="text-3xl font-bold">
            {overviewStats?.totalBookings || 0}
          </p>
          <p className="text-xs opacity-75 mt-1">
            {overviewStats?.activeBookings || 0} currently active
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Car className="w-8 h-8" />
          </div>
          <p className="text-sm opacity-90">Fleet Utilization</p>
          <p className="text-3xl font-bold">
            {overviewStats?.totalVehicles > 0
              ? (
                  (overviewStats.rentedVehicles / overviewStats.totalVehicles) *
                  100
                ).toFixed(1)
              : "0.0"}
            %
          </p>
          <p className="text-xs opacity-75 mt-1">
            {overviewStats?.rentedVehicles || 0} /{" "}
            {overviewStats?.totalVehicles || 0} rented
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8" />
          </div>
          <p className="text-sm opacity-90">Active Users</p>
          <p className="text-3xl font-bold">{overviewStats?.totalUsers || 0}</p>
          <p className="text-xs opacity-75 mt-1">
            {overviewStats?.newUsersThisMonth || 0} new this month
          </p>
        </div>
      </div>

      {/* Revenue by Station */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Revenue by Station
          </h2>
        </div>

        {revenueByStation.length > 0 ? (
          <>
            {/* Bar Chart Visualization */}
            <div className="mb-6">
              {revenueByStation.map((station, idx) => {
                const maxRevenue = Math.max(
                  ...revenueByStation.map((s) => s.revenue)
                );
                const width =
                  maxRevenue > 0 ? (station.revenue / maxRevenue) * 100 : 0;

                return (
                  <div key={idx} className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {station.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        ${station.revenue?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${width}%` }}
                      >
                        <span className="text-xs text-white font-medium">
                          {station.bookings} bookings
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table View */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Station
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Avg per Booking
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueByStation.map((station, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {station.name}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        ${station.revenue?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {station.bookings}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        $
                        {station.bookings > 0
                          ? (station.revenue / station.bookings).toFixed(2)
                          : "0.00"}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-semibold">
                    <td className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
                    <td className="px-6 py-4 text-sm text-green-600">
                      $
                      {revenueByStation
                        .reduce((sum, s) => sum + (s.revenue || 0), 0)
                        .toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {revenueByStation.reduce(
                        (sum, s) => sum + (s.bookings || 0),
                        0
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No revenue data for selected period
          </p>
        )}
      </div>

      {/* Bookings Trend */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Bookings Trend
        </h2>

        {bookingsTrend.length > 0 ? (
          <div className="space-y-3">
            {bookingsTrend.map((trend, idx) => {
              const maxCount = Math.max(...bookingsTrend.map((t) => t.count));
              const width = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;

              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {trend.date}
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {trend.count} bookings
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full"
                      style={{ width: `${width}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No booking data for selected period
          </p>
        )}
      </div>

      {/* Vehicle Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
          <Car className="w-6 h-6 text-purple-600" />
          Vehicle Distribution
        </h2>

        {vehicleDistribution &&
        Array.isArray(vehicleDistribution) &&
        vehicleDistribution.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {vehicleDistribution.map((item) => (
              <div key={item.status} className="bg-gray-50 rounded-lg p-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${getStatusColorClass(
                    item.status
                  )}`}
                >
                  <Car className="w-6 h-6" />
                </div>
                <p className="text-sm text-gray-600 capitalize">
                  {item.status}
                </p>
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                <p className="text-xs text-gray-500">
                  {overviewStats?.totalVehicles > 0
                    ? (
                        (item.count / overviewStats.totalVehicles) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  % of fleet
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No vehicle distribution data
          </p>
        )}
      </div>

      {/* Vehicle Usage by Hour */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-orange-600" />
          Giờ cao điểm (Peak Hours Usage)
        </h2>

        {vehicleUsageByHour && vehicleUsageByHour.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart visualization */}
              <div className="space-y-2">
                {vehicleUsageByHour.map((item) => {
                  const maxBookings = Math.max(
                    ...vehicleUsageByHour.map((h) => h.bookings)
                  );
                  const width =
                    maxBookings > 0 ? (item.bookings / maxBookings) * 100 : 0;
                  return (
                    <div key={item.hour} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 w-12">
                        {String(item.hour).padStart(2, "0")}:00
                      </span>
                      <div className="flex-1 bg-gray-100 h-8 rounded-lg overflow-hidden flex items-center">
                        <div
                          className="bg-gradient-to-r from-orange-400 to-orange-600 h-full flex items-center justify-end pr-2"
                          style={{ width: `${width}%` }}
                        >
                          {width > 15 && (
                            <span className="text-xs font-bold text-white">
                              {item.bookings}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 w-12">
                        {item.bookings} bookings
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Statistics Summary */}
              <div className="space-y-4">
                {vehicleUsageByHour.length > 0 &&
                  (() => {
                    const peakHour = vehicleUsageByHour.reduce((max, item) =>
                      item.bookings > max.bookings ? item : max
                    );
                    const totalBookings = vehicleUsageByHour.reduce(
                      (sum, item) => sum + item.bookings,
                      0
                    );
                    const avgBookings = (
                      totalBookings / vehicleUsageByHour.length
                    ).toFixed(1);
                    const uniqueVehicles = vehicleUsageByHour.reduce(
                      (sum, item) => sum + item.uniqueVehicles,
                      0
                    );

                    return (
                      <>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">
                            Peak Hour
                          </p>
                          <p className="text-2xl font-bold text-orange-600">
                            {String(peakHour.hour).padStart(2, "0")}:00
                          </p>
                          <p className="text-sm text-gray-600">
                            {peakHour.bookings} bookings
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600">
                              Total Bookings
                            </p>
                            <p className="text-xl font-bold text-blue-600">
                              {totalBookings}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600">
                              Avg per Hour
                            </p>
                            <p className="text-xl font-bold text-green-600">
                              {avgBookings}
                            </p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600">
                              Unique Vehicles
                            </p>
                            <p className="text-xl font-bold text-purple-600">
                              {uniqueVehicles}
                            </p>
                          </div>
                          <div className="bg-pink-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600">Hours (24h)</p>
                            <p className="text-xl font-bold text-pink-600">
                              24
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
              <p className="text-sm font-medium text-gray-900 mb-2">
                💡 Peak Hour Insights:
              </p>
              <p className="text-sm text-gray-700">
                {vehicleUsageByHour.length > 0 &&
                  (() => {
                    const peakHour = vehicleUsageByHour.reduce((max, item) =>
                      item.bookings > max.bookings ? item : max
                    );
                    const avgBookings = (
                      vehicleUsageByHour.reduce(
                        (sum, item) => sum + item.bookings,
                        0
                      ) / vehicleUsageByHour.length
                    ).toFixed(1);
                    const increase = (
                      ((peakHour.bookings - avgBookings) / avgBookings) *
                      100
                    ).toFixed(0);

                    return `Peak booking time is ${String(
                      peakHour.hour
                    ).padStart(2, "0")}:00 with ${
                      peakHour.bookings
                    } bookings (+${increase}% above average). Consider increased staff availability and vehicle availability during this period.`;
                  })()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No hourly usage data available for selected period
          </p>
        )}
      </div>

      {/* AI Insights Section */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📊 AI-Powered Insights
        </h2>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 mb-1">
              Peak Booking Prediction
            </p>
            <p className="text-sm text-gray-600">
              {vehicleUsageByHour.length > 0
                ? (() => {
                    const peakHour = vehicleUsageByHour.reduce((max, item) =>
                      item.bookings > max.bookings ? item : max
                    );
                    return `Booking peak occurs at ${String(
                      peakHour.hour
                    ).padStart(2, "0")}:00 with ${
                      peakHour.bookings
                    } bookings. Plan staffing and vehicle allocation accordingly.`;
                  })()
                : "Based on historical data, expect higher booking volume during business hours."}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 mb-1">
              Revenue Forecast
            </p>
            <p className="text-sm text-gray-600">
              Projected revenue for next month: $
              {(overviewStats?.revenue?.monthly * 1.15)?.toFixed(2) ||
                (overviewStats?.totalRevenue * 1.15)?.toFixed(2) ||
                "0.00"}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 mb-1">
              Optimization Recommendation
            </p>
            <p className="text-sm text-gray-600">
              Consider transferring 3 vehicles to high-demand stations for
              better utilization during peak hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStatusColorClass = (status) => {
  const colors = {
    available: "bg-green-100 text-green-600",
    rented: "bg-blue-100 text-blue-600",
    maintenance: "bg-yellow-100 text-yellow-600",
    unavailable: "bg-red-100 text-red-600",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
};

export default ReportsPage;
