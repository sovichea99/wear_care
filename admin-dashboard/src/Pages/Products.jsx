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
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
            stock: Number(variant.stock) || 0, // Convert stock to number
          })),
        }));
        //console.log("Fetched products:", normalizedProducts);
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
    console.log("Editing product:", normalizedProduct);
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

      // Ensure variant stock is number
      let index = 0;
      while (formData.has(`variants[${index}][stock]`)) {
        const stock = formData.get(`variants[${index}][stock]`);
        formData.set(`variants[${index}][stock]`, Number(stock));
        index++;
      }

      // Send request
      const response = await api.post("/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      //console.log("Add product response:", response);

      // Determine if response contains product
      const productData = response?.data?.data;

      if (!productData) {
        // If backend returns validation errors
        if (productData?.errors) {
          const errorMessages = Object.entries(productData.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          alert(`Failed to add product:\n${errorMessages}`);
        } else {
          alert(
            `Failed to add product. Server response:\n${JSON.stringify(
              productData
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
      };

      setProducts((prev) => [...prev, newProduct]);
      setShowAddForm(false);

      // Show success message
      setSuccessMessage("Product added successfully! 🎉");

      // Auto-hide after 3 seconds with fade-out animation
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "Error adding product:",
        error.response?.data || error.message
      );

      if (error.response?.data?.errors) {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        alert(`Failed to add product:\n${errorMessages}`);
      } else {
        alert("Failed to add product. Please check all fields and try again.");
      }
    }
  };

  const handleUpdate = async (updateData) => {
    try {
      const token = localStorage.getItem("authtoken");
      const productId = updateData._id;

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
        category_name: response.data.data.category_name,
        variants: response.data.data.variants.map((v) => ({
          size: v.size,
          stock: Number(v.stock),
        })),
      };

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

  // Helper function to check for changes
  const hasChanges = (newData, original) => {
    // Check basic fields
    const basicFields = ["name", "price", "category_name", "description"];
    for (let field of basicFields) {
      if (newData[field] !== original[field]) {
        return true;
      }
    }

    // Check variants (deep comparison)
    if (newData.variants && original.variants) {
      if (newData.variants.length !== original.variants.length) return true;

      for (let i = 0; i < newData.variants.length; i++) {
        const newVariant = newData.variants[i];
        const origVariant = original.variants[i];

        if (
          newVariant.size !== origVariant.size ||
          Number(newVariant.stock) !== Number(origVariant.stock)
        ) {
          return true;
        }
      }
    }

    // If image file is included, consider it a change
    if (newData instanceof FormData && newData.has("image")) {
      return true;
    }

    return false;
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

      // Show success message
      setSuccessMessage("Product deleted successfully! 🎉");

      // Auto-hide after 3 seconds with fade-out animation
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
    <div className="min-h-screen bg-gray-50">
      <header
        className={`sticky top-0 z-20 backdrop-blur-lg bg-white/80 border-b border-gray-200/50 shadow-sm transition-all duration-300 ${
          isScrolled ? "py-2" : "py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 ${
              isScrolled ? "md:gap-2" : "gap-4"
            }`}
          >
            <div
              className={`transition-all duration-300 ${
                isScrolled ? "scale-95 origin-left" : "scale-100"
              }`}
            >
              <h1
                className={`font-bold text-gray-800 transition-all duration-300 ${
                  isScrolled ? "text-xl" : "text-2xl md:text-3xl"
                }`}
              >
                Product Inventory
              </h1>
              {!isScrolled && (
                <p className="text-gray-500 mt-1 text-sm">
                  {products.length} products available
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowAddForm(true)}
                className={`bg-gradient-to-r from-pink-400 to-pink-300 hover:from-pink-500 hover:to-pink-400 text-white px-4 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                  isScrolled ? "py-1.5 text-sm" : "py-2.5"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {!isScrolled && "Add Product"}
              </button>
            </div>
          </div>

          <div
            className={`transition-all duration-300 overflow-hidden ${
              isScrolled ? "max-h-0 py-0" : "max-h-40 py-4"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg bg-white/50 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white/50 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const selectedSize = selectedSizes[product.id];
              const selectedVariant = product.variants?.find(
                (v) => v.size === selectedSize
              );
              const displayStock = selectedVariant
                ? selectedVariant.stock
                : product.variants?.reduce(
                    (sum, v) => sum + Number(v.stock),
                    0
                  ) || 0;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 border border-gray-100"
                >
                  <div className="relative pb-2/3 h-48 bg-gray-100">
                    <img
                      src={product.image || "https://via.placeholder.com/300"}
                      alt={product.name}
                      className="absolute h-full w-full object-contain p-4"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300";
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          displayStock > 0
                            ? "bg-pink-100 text-pink-600"
                            : "bg-red-100 text-red-500"
                        }`}
                      >
                        {selectedSize
                          ? `${displayStock} in stock (Size ${selectedSize})`
                          : `total: ${displayStock} in stock`}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800 line-clamp-1">
                          {product.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {product.category_name}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-pink-600">
                        ${product.price}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="relative">
                        <select
                          value={selectedSize || ""}
                          onChange={(e) =>
                            setSelectedSizes({
                              ...selectedSizes,
                              [product.id]: e.target.value,
                            })
                          }
                          className="appearance-none bg-gray-100 border border-gray-300 rounded-md pl-3 pr-5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                        >
                          <option value="" disabled>
                            size
                          </option>
                          {product.variants?.map((variant) => (
                            <option
                              key={variant.size}
                              value={variant.size}
                              disabled={variant.stock <= 0}
                            >
                              {variant.size}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-1 right-0 flex items-center px-2 text-gray-700">
                          <svg
                            className="fill-current h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex space-x-2">
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
