import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../services/auth";
import { IoIosHome } from "react-icons/io";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Login.jsx

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await adminLogin({ email, password });
      console.log("Login API Response:", response); // Debugging

      const { access_token, admin } = response;

      if (!access_token || !admin) {
        alert("Invalid login response!");
        return;
      }

      // Store token and admin details in localStorage
      sessionStorage.setItem("authToken", access_token);
      sessionStorage.setItem("admin", JSON.stringify(admin));

      console.log("Stored Admin Data:", sessionStorage.getItem("admin")); // Debugging

      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please check your credentials.");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="items-center justify-center">
      <div className="text-2xl flex items-center justify-center space-x-1 font-bold pb-5">
          <p className="text-purple-900">Care</p>
          <p className="text-pink-600">Wear</p>
          <IoIosHome className="text-pink-600" />
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md lg:w-96 md:w-90 sm:w-88 w-80">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:border-pink-600
                focus:ring-1 focus:ring-pink-600" 
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:border-pink-600
                focus:ring-1 focus:ring-pink-600"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-pink-600 text-white p-2 rounded hover:bg-pink-700"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
