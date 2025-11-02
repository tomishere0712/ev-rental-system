import { useState, useEffect } from "react";
import { adminService } from "../../services";
import {
  DollarSign,
  Car,
  Calendar,
  Users,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, revenueRes, distributionRes, bookingsRes] =
        await Promise.all([
          adminService.getOverviewStats(),
          adminService.getRevenueByStation(),
          adminService.getVehicleDistribution(),
          adminService.getRecentBookings(10),
        ]);

      // Unwrap responses - backend returns { success: true, data: {...} }
      const overviewData = overviewRes?.data || overviewRes || {};
      const revenueData = revenueRes?.data || revenueRes || [];
      const distributionData = distributionRes?.data || distributionRes || [];
      const bookingsData = bookingsRes?.data || bookingsRes || [];

      // Transform distribution array to object for easier display
      const vehicleDistribution = {};
      distributionData.forEach((item) => {
        vehicleDistribution[item.status] = item.count;
      });

      // Transform revenue array to object with station name and revenue
      const revenueByStation = revenueData.map((item) => ({
        name: item.station || item.name,
        revenue: item.revenue,
        bookings: item.bookings || 0,
      }));

      // Combine all data
      const combinedStats = {
        totalRevenue: overviewData.revenue?.total || 0,
        revenueTrend: "+12.5%",
        totalVehicles: overviewData.vehicles?.total || 0,
        availableVehicles: overviewData.vehicles?.available || 0,
        totalBookings:
          (overviewData.bookings?.active || 0) +
          (overviewData.bookings?.pending || 0),
        activeBookings: overviewData.bookings?.active || 0,
        totalUsers:
          (overviewData.users?.renters || 0) + (overviewData.users?.staff || 0),
        newUsersThisMonth: 0,
        revenueByStation,
        vehicleDistribution,
        recentBookings: bookingsData,
      };

      setStats(combinedStats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStats({
        totalRevenue: 0,
        totalVehicles: 0,
        totalBookings: 0,
        totalUsers: 0,
        revenueByStation: [],
        vehicleDistribution: {},
        recentBookings: [],
      });
    } finally {
      setLoading(false);
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System overview and key metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue?.toFixed(2) || "0.00"}`}
          icon={DollarSign}
          color="green"
          subtitle="All time earnings"
          trend={stats?.revenueTrend || "+12.5%"}
        />
        <StatCard
          title="Total Vehicles"
          value={stats?.totalVehicles || 0}
          icon={Car}
          color="blue"
          subtitle={`${stats?.availableVehicles || 0} available`}
          link="/admin/vehicles"
        />
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={Calendar}
          color="purple"
          subtitle={`${stats?.activeBookings || 0} active`}
        />
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="orange"
          subtitle={`${stats?.newUsersThisMonth || 0} this month`}
          link="/admin/users"
        />
      </div>

      {/* Quick Actions */}
      {/*   <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/vehicles/new"
            className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium transition-colors"
          >
            + Add New Vehicle
          </Link>
          <Link
            to="/admin/stations/new"
            className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-medium transition-colors"
          >
            + Add New Station
          </Link>
          <Link
            to="/admin/staff/new"
            className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center font-medium transition-colors"
          >
            + Add New Staff
          </Link>
        </div>
      </div> */}

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Station */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Revenue by Station
            </h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          {stats?.revenueByStation && stats.revenueByStation.length > 0 ? (
            <div className="space-y-3">
              {stats.revenueByStation.slice(0, 5).map((station, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {station.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      ${station.revenue?.toFixed(2) || "0.00"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {station.bookings || 0} bookings
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No revenue data available
            </p>
          )}
        </div>

        {/* Vehicle Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Vehicle Status
            </h3>
            <Car className="w-5 h-5 text-blue-600" />
          </div>
          {stats?.vehicleDistribution ? (
            <div className="space-y-3">
              {Object.entries(stats.vehicleDistribution).map(
                ([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(
                          status
                        )}`}
                      ></div>
                      <span className="capitalize font-medium text-gray-900">
                        {status}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {count} vehicles
                    </span>
                  </div>
                )
              )}
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-blue-600">
                    {stats.totalVehicles}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No vehicle data available
            </p>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Bookings
        </h3>
        {stats?.recentBookings && stats.recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Booking #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentBookings.slice(0, 10).map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {booking.bookingNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {booking.user?.fullName || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {booking.vehicle?.brand} {booking.vehicle?.model}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      ${booking.totalAmount}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getBookingStatusBadge(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent bookings</p>
        )}
      </div>
    </div>
  );
};

// eslint-disable-next-line react/prop-types
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
  link,
}) => {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-sm font-medium text-green-600">{trend}</span>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </>
  );

  if (link) {
    return (
      <Link
        to={link}
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
      >
        {content}
      </Link>
    );
  }

  return <div className="bg-white rounded-lg shadow-md p-6">{content}</div>;
};

const getStatusColor = (status) => {
  const colors = {
    available: "bg-green-500",
    rented: "bg-blue-500",
    maintenance: "bg-yellow-500",
    unavailable: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

const getBookingStatusBadge = (status) => {
  const badges = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    active: "bg-blue-100 text-blue-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return badges[status] || "bg-gray-100 text-gray-800";
};

export default AdminDashboard;
