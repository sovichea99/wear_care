import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Customers from "./Pages/Customers";
import Dashboard from "./Pages/Dashboard";
import Orders from "./Pages/Orders";
import Products from "./Pages/Products";
import Login from "./Pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Category from "./Pages/Category";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
         <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="category" element={<Category />} />
          <Route path="products" element={<Products />} />
          <Route path="customers" element={<Customers />} />
        </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}