import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../services/auth";
import { IoIosHome } from "react-icons/io";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await adminLogin({ email, password });
      const { admin } = response;

      if (!admin) {
        setError("Invalid login response from server");
        setLoading(false);
        return;
      }

      // Store admin info
      sessionStorage.setItem("admin", JSON.stringify(admin));

      // Add a small delay before navigation to prevent cancelation
      setTimeout(() => {
        navigate("/");
      }, 100);
      
    } catch (error) {
      console.error("Login error:", error); // Keep this for debugging
      setError(error.message || "Login failed. Please check your credentials.");
      setLoading(false);
    }
    // Remove setLoading from finally - we handle it in catch and success
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
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:border-pink-600 focus:ring-1 focus:ring-pink-600" 
                required
                disabled={loading}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:border-pink-600 focus:ring-1 focus:ring-pink-600"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 text-white p-2 rounded hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}