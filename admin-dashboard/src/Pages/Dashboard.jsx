import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChartBarIcon,
  ShoppingBagIcon,
  UsersIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import api from "../services/api";
import StatusUpdater from "../components/StatusUpdater";
import CountUp from "react-countup";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    recentOrders: [],
    isLoading: true,
    error: null,
  });

  const fetchDashboardData = async () => {
    try {
      setStats((prev) => ({ ...prev, isLoading: true, error: null }));

      const [statsRes, ordersRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/recent-orders"),
      ]);

      setStats({
        totalOrders: statsRes.data.totalOrders,
        totalProducts: statsRes.data.totalProducts,
        totalCustomers: statsRes.data.totalCustomers,
        totalRevenue: statsRes.data.totalRevenue || 0,
        recentOrders: ordersRes.data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStats((prev) => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || "Failed to load dashboard data",
      }));
    }
  };
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (stats.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{stats.error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-2 text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <button
          onClick={fetchDashboardData}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowPathIcon className="h-4 w-4 mr-1" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/orders">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <ShoppingBagIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">
                  <CountUp
                    end={stats.totalOrders.toLocaleString()}
                    duration={1.5}
                    separator=","
                  />
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/products" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-pink-500 mr-3" />
              <div>
                <p className="text-gray-500">Total Products</p>
                <p className="text-2xl font-bold">
                  <CountUp
                    end={stats.totalProducts.toLocaleString()}
                    duration={1.5}
                    separator=","
                  />
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/customers" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold">
                  <CountUp
                    end={stats.totalCustomers}
                    duration={1.5}
                    separator=","
                  />
                </p>
              </div>
            </div>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-yellow-500 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">
                $
                <CountUp
                  end={stats.totalRevenue}
                  duration={1.5}
                  separator=","
                />
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Orders</h2>
          <span className="text-sm text-gray-500">Last 5 orders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Order ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Customer
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentOrders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {/* Shorten the MongoDB ID for better display */}#
                    {order._id?.toString().substring(18)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.user?.name || (order.user_id ? "Customer" : "Guest")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                    ${(order.total || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* 
          This is the interactive StatusUpdater component.
          It replaces the static status span.
        */}
                    <StatusUpdater
                      order={order}
                      onStatusChange={(updatedOrder) => {
                        // This callback function ensures the UI updates instantly
                        // without needing a full page refresh. It finds the order
                        // in the current state and replaces it with the updated version
                        // returned from the API.
                        setStats((prev) => ({
                          ...prev,
                          recentOrders: prev.recentOrders.map((o) =>
                            o._id === updatedOrder._id ? updatedOrder : o
                          ),
                        }));
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.recentOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent orders found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
