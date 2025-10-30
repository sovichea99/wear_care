import { useEffect, useState } from "react";
import api from "../services/api";
import EditProductForm from "./EditProductForm";
import AddProductForm from "./AddProductForm";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  // Add categories state to your Products component
  const [allCategories, setAllCategories] = useState([]);

  // Add this useEffect to fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        const normalizedCategories = response.data.map((category) => ({
          ...category,
          id: category.id || category._id,
          uses_sizes:
            category.uses_sizes !== undefined ? category.uses_sizes : true,
        }));
        setAllCategories(normalizedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        const normalizedProducts = response.data.data.map((product) => ({
          ...product,
          id: product.id,
          category_id: product.category_id,
          variants: (product.variants || []).map((variant) => ({
            size: variant.size,
            stock: Number(variant.stock) || 0,
          })),
          stock: product.stock,
        }));
        setProducts(normalizedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    if (!product.id) {
      console.error("Cannot edit product: ID is missing", product);
      alert("Cannot edit product: Missing ID.");
      return;
    }
    const normalizedProduct = {
      ...product,
      id: product.id,
      category_id: product.category_id || product.category,
    };
    // console.log("Editing product:", normalizedProduct);
    setEditingProduct(normalizedProduct);
  };

  const handleAddProduct = async (formData, imageFile) => {
    try {
      if (!imageFile) {
        alert("Please select an image for the product.");
        return;
      }

      const token = localStorage.getItem("authtoken");

      // Ensure price is number
      const price = formData.get("price");
      if (price) formData.set("price", Number(price));

      // Send request
      const response = await api.post("/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const productData = response?.data?.data;

      if (!productData) {
        // Check for validation errors from backend
        if (response?.data?.errors) {
          const errorMessages = Object.entries(response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          alert(`Failed to add product:\n${errorMessages}`);
        } else {
          alert(
            `Failed to add product. Server response:\n${JSON.stringify(
              response?.data
            )}`
          );
        }
        return;
      }

      // Normalize product
      const newProduct = {
        ...productData,
        id: productData.id || productData._id,
        category_id: productData.category_id || productData.category,
        description: productData.description,
        variants: (productData.variants || []).map((v) => ({
          size: v.size,
          stock: Number(v.stock),
        })),
        stock: productData.stock,
      };

      setProducts((prev) => [...prev, newProduct]);
      setShowAddForm(false);

      // Show success message
      setSuccessMessage("Product added successfully! 🎉");
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "Error adding product:",
        error.response?.data || error.message
      );

      // Show detailed error message
      if (error.response?.data?.errors) {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        alert(`Failed to add product:\n${errorMessages}`);
      } else if (error.response?.data?.message) {
        alert(`Failed to add product: ${error.response.data.message}`);
      } else {
        alert("Failed to add product. Please check all fields and try again.");
      }
    }
  };

  const handleUpdate = async (updateData) => {
    try {
      const token = localStorage.getItem("authtoken");

      // Handle both FormData and regular objects
      const productId = updateData.get?.("_id") || updateData._id;

      if (!productId) {
        throw new Error("Product ID is missing!");
      }

      // Get original product
      const originalProduct = editingProduct;

      // Check if nothing changed
      if (!hasChanges(updateData, originalProduct)) {
        setWarningMessage("Bro no changes is detected. 🙄");
        setTimeout(() => {
          setWarningMessage("");
        }, 2000);
        return;
      }

      let response;

      if (updateData instanceof FormData) {
        response = await api.put(`/products/${productId}`, updateData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        response = await api.put(`/products/${productId}`, updateData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      const updatedProduct = {
        ...response.data.data,
        id: response.data.data.id,
        category_name: response.data.data.category_name, // Make sure this is set correctly
        category_id: response.data.data.category_id, // Also update category_id
        variants: (response.data.data.variants || []).map((v) => ({
          size: v.size,
          stock: Number(v.stock),
        })),
        stock: response.data.data.stock,
      };

      // console.log("Updated product from API:", updatedProduct); // Debug log

      setProducts((prev) =>
        prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
      );

      setSuccessMessage("Product updated successfully! 🎉");
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      setEditingProduct(null);
    } catch (error) {
      console.error("Update error:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack,
      });
      throw new Error(
        error.response?.data?.message || "Failed to update product"
      );
    }
  };

  // Enhanced hasChanges function to handle FormData
  const hasChanges = (newData, original) => {
    // If it's FormData, extract values and compare
    if (newData instanceof FormData) {
      const name = newData.get("name");
      const price = Number(newData.get("price"));
      const category_name = newData.get("category_name");
      const description = newData.get("description") || "";
      const stock = Number(newData.get("stock") || 0);

      // Check basic fields
      if (name !== original.name) {
        console.log("Name changed:", name, "!=", original.name);
        return true;
      }
      if (price !== Number(original.price)) {
        console.log("Price changed:", price, "!=", original.price);
        return true;
      }
      if (category_name !== original.category_name) {
        console.log(
          "Category changed:",
          category_name,
          "!=",
          original.category_name
        );
        return true;
      }
      if (description !== (original.description || "")) {
        console.log("Description changed");
        return true;
      }

      // Check if image file is included
      const imageFile = newData.get("image");
      if (imageFile && imageFile.name && imageFile.size > 0) {
        console.log("Image changed");
        return true;
      }

      // Check stock for no-size products
      if (stock !== Number(original.stock || 0)) {
        console.log("Stock changed:", stock, "!=", original.stock);
        return true;
      }

      // Check variants from FormData
      const variantsJson = newData.get("variants");
      if (variantsJson) {
        try {
          const newVariants = JSON.parse(variantsJson);
          const originalVariants = original.variants || [];

          if (newVariants.length !== originalVariants.length) {
            console.log("Variants length changed");
            return true;
          }

          for (let i = 0; i < newVariants.length; i++) {
            const newVariant = newVariants[i];
            const originalVariant = originalVariants[i];

            if (!originalVariant) {
              console.log("New variant added");
              return true;
            }
            if (newVariant.size !== originalVariant.size) {
              console.log("Variant size changed");
              return true;
            }
            if (Number(newVariant.stock) !== Number(originalVariant.stock)) {
              console.log("Variant stock changed");
              return true;
            }
          }
        } catch (error) {
          console.log("Error parsing variants:", error);
          return true;
        }
      } else {
        // If no variants in new data but original has variants, it's a change
        if (original.variants && original.variants.length > 0) {
          console.log("Variants removed");
          return true;
        }
      }

      console.log("No changes detected");
      return false;
    } else {
      // Regular object comparison
      const basicFields = ["name", "price", "category_name", "description"];
      for (let field of basicFields) {
        if (field === "price") {
          if (Number(newData[field]) !== Number(original[field])) {
            console.log(
              `${field} changed:`,
              newData[field],
              "!=",
              original[field]
            );
            return true;
          }
        } else if (newData[field] !== (original[field] || "")) {
          console.log(
            `${field} changed:`,
            newData[field],
            "!=",
            original[field]
          );
          return true;
        }
      }

      // Check stock for no-size products
      if (Number(newData.stock || 0) !== Number(original.stock || 0)) {
        console.log("Stock changed:", newData.stock, "!=", original.stock);
        return true;
      }

      // Check variants (deep comparison)
      const newVariants = newData.variants || [];
      const originalVariants = original.variants || [];

      // If both have variants, compare them
      if (newVariants.length > 0 && originalVariants.length > 0) {
        if (newVariants.length !== originalVariants.length) {
          console.log("Variants length changed");
          return true;
        }

        for (let i = 0; i < newVariants.length; i++) {
          const newVariant = newVariants[i];
          const origVariant = originalVariants[i];

          if (
            newVariant.size !== origVariant.size ||
            Number(newVariant.stock) !== Number(origVariant.stock)
          ) {
            console.log("Variant changed");
            return true;
          }
        }
      } else if (newVariants.length !== originalVariants.length) {
        // If one has variants and the other doesn't, it's a change
        console.log("Variants presence changed");
        return true;
      }

      console.log("No changes detected");
      return false;
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("authtoken");
      await api.delete(`/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((product) => product.id !== productId));

      setSuccessMessage("Product deleted successfully! 🎉");
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };
  // Helper function to check if a product uses sizes
  const getProductUsesSizes = (product) => {
    const category = allCategories.find(
      (cat) =>
        cat.name === product.category_name || cat.id === product.category_id
    );
    return category ? category.uses_sizes !== false : true; // Default to true for backward compatibility
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(filterQuery.toLowerCase()) ?? true;
    const matchesCategory =
      selectedCategory === "all" || product.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    ...new Set(products.map((product) => product.category_name)),
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-gray-50">
      <header
        className={`sticky lg:-top-8 md:-top-8 xl:-top-8 -top-3 z-20 backdrop-blur-lg rounded-xl bg-white/5 border-b border-gray-200/50 shadow-sm transition-all duration-300 ${
          isScrolled ? "py-1" : "py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between gap-2 items-center">
            {/*Logo Section*/}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <div className="h-7 w-7 sm:h-8 sm:w-8 bg-gradient-to-r from-pink-400 to-pink-300 rounded-lg flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h1
                  className={`font-bold text-gray-800 transition-all duration-300 ${
                    isScrolled ? "text-base sm:text-lg" : "text-lg sm:text-xl"
                  }`}
                >
                  Inventory
                </h1>
                {!isScrolled && (
                  <p className="text-gray-500 text-[10px] sm:text-xs flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    <span className="whitespace-nowrap">
                      {products.reduce((total, product) => {
                        const usesSizes = getProductUsesSizes(product);
                        if (usesSizes && product.variants?.length > 0) {
                          return (
                            total +
                            product.variants.reduce(
                              (sum, v) => sum + Number(v.stock || 0),
                              0
                            )
                          );
                        } else {
                          return total + Number(product.stock || 0);
                        }
                      }, 0)}{" "}
                      items in stock
                    </span>
                  </p>
                )}
              </div>
            </div>
            {/*Search and Filter Controls - Hidden on when scrolled*/}
            <div
              className={`hidden md:flex items-center gap-4 transition-all duration-300 ${
                isScrolled ? "opacity-100" : "opacity-90"
              }`}
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="block w-40 lg:w-64 pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white focus:border-collapse outline-none focus:outline-nonetransition-all text-sm"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none block pl-3 pr-8 lg:pr-9 py-2 border border-gray-200 rounded-lg bg-white outline-none transition-all text-sm [&::-webkit-appearance]:none [&::-moz-appearance]:none"
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                }}
              >
                <option value="all">All Category</option>
                {categories.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            {/*Action Buttons*/}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/*Mobile Search Toggle Button*/}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="md:hidden p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-0"
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {/*Add Product Button*/}
              <button
                onClick={() => setShowAddForm(true)}
                className={`bg-gradient-to-r from-pink-400 to-pink-300 hover:from-pink-500 hover:to-pink-400 px-1.5 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1 ${
                  isScrolled
                    ? "py-1.5 px-2 sm:px-3 text-xs sm:text-sm"
                    : "py-2 px-4"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {isScrolled ? "Add" : "Add Products"}
                </span>
              </button>
            </div>
          </div>
          {/*Mobile Search and Filter - Appears when toggle*/}
          <div
            className={`md:hidden transition-all duration-300 overflow-hidden ${
              showMobileSearch ? "max-h-40 py-3" : "max-h-0 py-0"
            }`}
          >
            <div className="grid grid-cols-1 gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setShowMobileSearch(false);
                      e.target.blur(); // Remove focus from input
                    }
                  }}
                  className="block w-full pl-4 py-2 border border:gray-200 rounded-lg bg-white focus:border-collapse outline-none focus:outline-none transition-all text-sm "
                />
              </div>
              <select
                name=""
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block z-0 w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:border-collapse outline-none focus:outline-none transition-all tex-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>
      <main className="lg:max-w-7xl max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-700">
              No products found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setFilterQuery("");
                setSelectedCategory("all");
              }}
              className="mt-4 text-pink-600 hover:text-pink-700 font-medium"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const usesSizes = getProductUsesSizes(product);
              const selectedSize = selectedSizes[product.id];
              const selectedVariant = product.variants?.find(
                (v) => v.size === selectedSize
              );
              const displayStock = usesSizes
                ? selectedVariant
                  ? selectedVariant.stock
                  : product.variants?.reduce(
                      (sum, v) => sum + Number(v.stock),
                      0
                    ) || 0
                : product.stock || 0;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 border border-gray-100"
                >
                  <div className="relative h-32 sm:h-40 lg:h-48 bg-gray-100">
                    <img
                      src={product.image || "https://via.placeholder.com/300"}
                      alt={product.name}
                      className="absolute h-full w-full object-contain p-4 mt-2"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300";
                      }}
                    />
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          displayStock > 0
                            ? "bg-pink-100 text-pink-600"
                            : "bg-red-100 text-red-500"
                        }`}
                      >
                        {usesSizes
                          ? selectedSize
                            ? `${displayStock} in stock`
                            : `Total: ${displayStock} in stock`
                          : `${displayStock} in stock`}
                      </span>
                    </div>
                  </div>
                  {/* Content Container - Compact padding on mobile */}
                  <div className="p-2 sm:p-3 lg:p-4">
                    <div className="flex justify-between items-start gap-1 mb-1.5 sm:mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">
                          {product.name}
                        </h3>
                        <span className="text-[10px] sm:text-xs text-gray-500">
                          {product.category_name}
                        </span>
                      </div>
                      <span className="font-bold text-sm sm:text-base  lg:text-lg text-pink-600 flex-shrink-0">
                        ${product.price}
                      </span>
                    </div>

                    <p className="hidden sm:block text-xs overflow-hidden text-ellipsis whitespace-nowrap lg:text-sm text-gray-500 line-clamp-1 mb-2 lg:mb-3">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between mt-3 gap-1 sm:gap-2">
                      <div className="relative flex-1 min-w-0">
                        {usesSizes ? (
                          <select
                            value={selectedSize || ""}
                            onChange={(e) =>
                              setSelectedSizes({
                                ...selectedSizes,
                                [product.id]: e.target.value,
                              })
                            }
                            className="appearance-none bg-gray-100  rounded-md pl-1 pr-6 sm:pl-3 sm:pr-7 py-1.5 text-xs sm:text-sm focus:outline-none text-center w-full"
                          >
                            <option value="" disabled className="text-center">
                              Size
                            </option>
                            {product.variants?.map((variant) => (
                              <option
                                key={variant.size}
                                value={variant.size}
                                disabled={variant.stock <= 0}
                                className="text-center"
                              >
                                {variant.size}
                              </option>
                            ))}
                          </select>
                        ) : (
                          // For no-size products, don't render anything or render a placeholder
                          <div className="w-12 sm:w-16"></div>
                        )}
                        {usesSizes && (
                          <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center px-1 text-gray-700">
                            <svg
                              className="fill-current h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-pink-500 hover:text-pink-600 transition-colors p-1.5 rounded-full hover:bg-pink-100 bg-pink-50"
                          title="Edit"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="text-red-500 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-red-100 bg-red-50"
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {editingProduct && (
        <EditProductForm
          product={editingProduct}
          onUpdate={handleUpdate}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      {showAddForm && (
        <AddProductForm
          onAdd={handleAddProduct}
          onCancel={() => setShowAddForm(false)}
          categories={allCategories} // Pass categories to the form
        />
      )}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white mt-4 text-lg font-medium">Deleting...</p>
        </div>
      )}

      {warningMessage && (
        <div
          id="success-toast"
          className="fixed top-4 left-4 right-4 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:right-auto z-50 transition-all duration-500 ease-out sm:max-w-md"
          style={{
            opacity: 0,
            transform: "translateY(-20px)",
            animation: "fadeInDown 0.5s ease-out forwards",
          }}
        >
          <div className="bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg border border-orange-400">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-sm sm:text-base text-center sm:text-left">
                {warningMessage}
              </span>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div
          id="success-toast"
          className="fixed top-4 left-4 right-4 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:right-auto z-50 transition-all duration-500 ease-out sm:max-w-md"
          style={{
            opacity: 0,
            transform: "translateY(-20px)",
            animation: "fadeInDown 0.5s ease-out forwards",
          }}
        >
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg border border-green-400">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-sm sm:text-base text-center sm:text-left">
                {successMessage}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
