// UPDATED Orders.jsx with correct data structure handling

import { useEffect, useState } from "react";
import api from "../services/api";
import StatusUpdater from "../components/StatusUpdater";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Orders() {
  const [stats, setStats] = useState({
    recentOrders: [],
    isLoading: true,
    error: null,
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  const fetchDashboardData = async (page = 1) => {
    try {
      setStats((prev) => ({ ...prev, isLoading: true, error: null }));

      const ordersRes = await api.get(
        `/orders/?page=${page}&limit=${ordersPerPage}`
      );

      console.log("Orders API Response:", ordersRes.data);

      // Handle the paginated response structure
      const ordersData =
        ordersRes.data.orders || ordersRes.data.data || ordersRes.data;

      setStats({
        recentOrders: Array.isArray(ordersData) ? ordersData : [],
        pagination: ordersRes.data.pagination || {
          current_page: ordersRes.data.current_page,
          last_page: ordersRes.data.last_page,
          total: ordersRes.data.total,
        },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStats((prev) => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || "Failed to load orders",
      }));
    }
  };

  const handleOrderClick = async (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);

    setIsLoadingOrderDetails(true);
    try {
      console.log("Fetching details for order ID:", order._id || order.id);

      // Try both possible ID formats
      const orderId = order._id || order.id;
      const response = await api.get(`/orders/${orderId}`);

      console.log("Full order response:", response.data);
      console.log("💥 RAW API RESPONSE for single order:", response.data);
      // Handle different possible response structures
      let orderData = response.data;

      // If the response is paginated or wrapped
      if (response.data.data) {
        orderData = response.data.data;
      }

      // If it's an array, take the first item
      if (Array.isArray(orderData)) {
        orderData = orderData[0];
      }

      console.log("Processed order data:", orderData);
      console.log("Items array:", orderData.items);

      // Check for items in different possible locations
      let items =
        orderData.orderItems ||
        orderData.items ||
        orderData.order_items ||
        orderData.products ||
        orderData.line_items ||
        [];
      console.log("Final items array:", items);

      setSelectedOrder({
        ...orderData,
        items: items, // Ensure items are set
        formattedDate: new Date(orderData.created_at).toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      console.error("Error response:", error.response?.data);
    } finally {
      setIsLoadingOrderDetails(false);
    }
  };

  const handleStatusUpdate = (updatedOrder) => {
    setStats((prev) => ({
      ...prev,
      recentOrders: prev.recentOrders.map((order) =>
        (order._id || order.id) === (updatedOrder._id || updatedOrder.id)
          ? updatedOrder
          : order
      ),
    }));

    if (
      (selectedOrder?._id || selectedOrder?.id) ===
      (updatedOrder._id || updatedOrder.id)
    ) {
      setSelectedOrder((prev) => ({
        ...prev,
        status: updatedOrder.status,
      }));
    }
  };

  useEffect(() => {
    fetchDashboardData(currentPage);
  }, []);

  if (stats.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        <span className="ml-2">Loading orders...</span>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <p className="text-lg font-medium mb-2">Error loading orders</p>
        <p className="mb-4">{stats.error}</p>
        <button
          onClick={() => fetchDashboardData()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Order Management
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => fetchDashboardData(currentPage)}
              className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentOrders.map((order) => (
                  <tr
                    key={order._id || order.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleOrderClick(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #
                      {(order._id || order.id)?.toString().substring(18) ||
                        "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.user?.name ||
                        order.customer?.name ||
                        (order.user_id ? "Customer" : "Guest")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                      ${(order.total || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* This wrapper div will catch the click and stop it from reaching the <tr> */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <StatusUpdater
                          order={order}
                          onStatusChange={handleStatusUpdate}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.recentOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No orders found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setIsModalOpen(false)}
              ></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {isLoadingOrderDetails ? (
                <div className="p-8 flex justify-center items-center h-64">
                  <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Order #
                          {(selectedOrder?._id || selectedOrder?.id)
                            ?.toString()
                            .substring(18) || "N/A"}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {selectedOrder?.formattedDate || ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-400 text-base font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">
                          Customer Information
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-sm">
                            <span className="font-medium">Name:</span>{" "}
                            {selectedOrder?.user?.name ||
                              selectedOrder?.customer?.name ||
                              "Guest"}
                          </p>
                          <p className="text-sm mt-1">
                            <span className="font-medium">Email:</span>{" "}
                            {selectedOrder?.user?.email ||
                              selectedOrder?.customer?.email ||
                              "N/A"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">
                          Order Summary
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>
                              ${((selectedOrder?.total || 0) * 0.9).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span>Tax (10%):</span>
                            <span>
                              ${((selectedOrder?.total || 0) * 0.1).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t border-gray-200">
                            <span>Total:</span>
                            <span>
                              ${(selectedOrder?.total || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Order Items
                      </h4>
                      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Product
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Price
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Qty
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedOrder?.items &&
                            selectedOrder.items.length > 0 ? (
                              selectedOrder.items.map((item, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <img
                                          className="h-10 w-10 rounded-md object-cover"
                                          src={
                                            item.image_url ||
                                            item.image ||
                                            "/placeholder-product.png"
                                          }
                                          alt={
                                            item.name ||
                                            item.product_name ||
                                            "Product"
                                          }
                                          onError={(e) => {
                                            e.target.src =
                                              "/placeholder-product.png";
                                          }}
                                        />
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                          {item.name ||
                                            item.product_name ||
                                            "Unknown Product"}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          SKU:{" "}
                                          {item.product_id ||
                                            item.sku ||
                                            item.id ||
                                            "N/A"}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    $
                                    {typeof item.price === "number"
                                      ? item.price.toFixed(2)
                                      : item.price || "0.00"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.quantity || item.qty || 0}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    $
                                    {(
                                      (item.price || 0) *
                                      (item.quantity || item.qty || 0)
                                    ).toFixed(2)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="4"
                                  className="px-6 py-4 text-center text-sm text-gray-500"
                                >
                                  No items found for this order
                                  <br />
                                  <span className="text-xs">
                                    Check API response structure above
                                  </span>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
