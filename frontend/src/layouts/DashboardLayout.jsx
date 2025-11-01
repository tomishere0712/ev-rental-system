import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import DashboardNavbar from "../components/layout/DashboardNavbar";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
