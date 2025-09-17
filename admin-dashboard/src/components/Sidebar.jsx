import { NavLink } from "react-router-dom";
import {
  ChartBarIcon,
  ShoppingBagIcon,
  TableCellsIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { adminLogout } from "../services/auth";
import { IoIosHome } from "react-icons/io";


export default function Sidebar({ onClose }) {
  const navigation = [
    { name: "Dashboard", href: "/", icon: ChartBarIcon },
    { name: "Orders", href: "/orders", icon: ShoppingBagIcon },
    { name: "Category", href: "/category", icon: TableCellsIcon},
    { name: "Products", href: "/products", icon: ShoppingBagIcon },
    { name: "Customers", href: "/customers", icon: UsersIcon },
  ];

  return (
    <div className="w-64 h-full bg-white flex flex-col overflow-y-auto">
      {/* Logo & Close Button */}
      <div className="p-4 mt-3 flex justify-between items-center">
        <div className="text-xl flex items-center space-x-1 font-bold">
          <p className="text-purple-900">Care</p>
          <p className="text-pink-600">Wear</p>
          <IoIosHome className="text-pink-600" />
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="mt-3 flex-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-gray-700 transition ${
                isActive ? "bg-pink-100" : "hover:bg-pink-50"
              }`
            }
          >
            <item.icon className="h-10 w-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <button
        onClick={() => {
          adminLogout();
          window.location.href = "/login";
        }}
        className="flex items-center bg-red-50 justify-center mb-5 gap-2 mx-4 my-4 p-3 text-red-600 hover:bg-red-100 rounded-lg transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
          />
        </svg>
        Logout
      </button>
    </div>
  );
}
