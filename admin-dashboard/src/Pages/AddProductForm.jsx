import { useState, useEffect, useRef } from "react";
import api from "../services/api";

export default function AddProductForm({
  onAdd,
  onCancel,
  categories: propCategories,
}) {
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    category_id: "",
    description: "",
    variants: [],
    stock: 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [currentVariant, setCurrentVariant] = useState({
    size: "S",
    stock: "",
  });
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duplicateSizeWarning, setDuplicateSizeWarning] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  // Get the selected category and check if it uses sizes
  const selectedCategory = categories.find(
    (c) => c.id === newProduct.category_id
  );

  // Use the category's uses_sizes property
  const isNoSizeCategory = selectedCategory && !selectedCategory.uses_sizes;

  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      // Use the categories passed from parent
      const normalizedCategories = propCategories.map((category) => ({
        ...category,
        id: category.id || category._id,
        name: category.name,
        uses_sizes:
          category.uses_sizes !== undefined ? category.uses_sizes : true,
      }));
      setCategories(normalizedCategories);
    } else {
      // Fallback: fetch categories if not provided (backward compatibility)
      setIsLoading(true);
      const fetchCategories = async () => {
        try {
          const response = await api.get("/categories");
          console.log("Categories loaded:", response.data);
          const normalizedCategories = response.data.map((category) => ({
            ...category,
            id: category.id || category._id,
            name: category.name,
            uses_sizes:
              category.uses_sizes !== undefined ? category.uses_sizes : true,
          }));
          setCategories(normalizedCategories);
        } catch (err) {
          setError("Failed to load categories.");
          console.error("Error fetching categories:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCategories();
    }
  }, [propCategories]); // Add propCategories as dependency

  // ... rest of your AddProductForm code remains the same
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "category_id") {
      // When category changes, clear variants if switching to no-size category
      const selectedCat = categories.find((c) => c.id === value);
      if (selectedCat && !selectedCat.uses_sizes) {
        setNewProduct((prev) => ({
          ...prev,
          [name]: value,
          variants: [], // Clear variants for no-size categories
          stock: 0,
        }));
      } else {
        setNewProduct((prev) => ({
          ...prev,
          [name]: value,
          stock: 0,
        }));
      }
    } else if (name === "stock") {
      // Handle direct stock input for no-size categories
      setNewProduct((prev) => ({
        ...prev,
        [name]: Number(value),
      }));
    } else {
      setNewProduct((prev) => ({
        ...prev,
        [name]: name === "price" ? Number(value) : value,
      }));
    }
  };

  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    setCurrentVariant((prev) => ({
      ...prev,
      [name]: name === "stock" ? Number(value) : value,
    }));
  };

  const addVariant = () => {
    if (isNoSizeCategory) {
      setError(
        "Cannot add size variants to this category. Please select a different category."
      );
      return;
    }

    if (currentVariant.stock === "" || currentVariant.stock < 0) return;

    const existingVariantIndex = newProduct.variants.findIndex(
      (v) => v.size === currentVariant.size
    );

    if (existingVariantIndex >= 0) {
      setDuplicateSizeWarning(
        `Size ${currentVariant.size} already exists - stock will be added`
      );
      setTimeout(() => setDuplicateSizeWarning(""), 3000);

      setNewProduct((prev) => ({
        ...prev,
        variants: prev.variants.map((v, i) =>
          i === existingVariantIndex
            ? { ...v, stock: v.stock + Number(currentVariant.stock) }
            : v
        ),
      }));
    } else {
      setDuplicateSizeWarning("");
      setNewProduct((prev) => ({
        ...prev,
        variants: [
          ...prev.variants,
          { size: currentVariant.size, stock: Number(currentVariant.stock) },
        ],
      }));
    }

    setCurrentVariant({ size: "S", stock: "" });
  };

  const removeVariant = (index) => {
    setNewProduct((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Validation
    if (!newProduct.name.trim()) {
      setError("Please enter a product name");
      return;
    }

    if (!newProduct.price || newProduct.price <= 0) {
      setError("Please enter a valid price");
      return;
    }

    if (!newProduct.category_id) {
      setError("Please select a category");
      return;
    }

    if (!imageFile) {
      setError("Please select a product image");
      return;
    }

    // Conditional validation based on category type
    if (!isNoSizeCategory && newProduct.variants.length === 0) {
      setError("Please add at least one size variant for this category");
      return;
    }

    if (isNoSizeCategory && (!newProduct.stock || newProduct.stock < 0)) {
      setError("Please enter a valid stock quantity");
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("name", newProduct.name.trim());
      formData.append("price", Number(newProduct.price));
      formData.append("category_id", newProduct.category_id);
      formData.append("description", newProduct.description?.trim() || "");

      const selectedCategory = categories.find(
        (c) => c.id === newProduct.category_id
      );
      if (selectedCategory) {
        formData.append("category_name", selectedCategory.name);
      }

      // Handle variants/stock based on category type
      if (!isNoSizeCategory && newProduct.variants.length > 0) {
        newProduct.variants.forEach((variant, i) => {
          formData.append(`variants[${i}][size]`, variant.size);
          formData.append(`variants[${i}][stock]`, Number(variant.stock));
        });
      } else if (isNoSizeCategory) {
        formData.append("stock", Number(newProduct.stock));
      }

      // Add image
      formData.append("image", imageFile);

      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      await onAdd(formData, imageFile);
    } catch (error) {
      console.error("Form submission error:", error);
      // Use the actual error message from the backend if available
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to add product. Please check all fields and try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          setError("File size too large. Please select an image under 5MB.");
          return;
        }
        setImageFile(file);
        setError(null); // Clear any previous errors
      } else {
        setError("Please select a valid image file (JPG, PNG, GIF).");
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size too large. Please select an image under 5MB.");
        return;
      }
      setImageFile(file);
      setError(null); // Clear any previous errors
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="modal fixed z-40 inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 overflow-y-auto py-6">
      <div className="relative bg-white rounded-xl shadow-lg w-[400px] max-h-[90vh] flex flex-col">
        <div className="overflow-y-auto p-4 flex-grow">
          <h2 className="text-xl font-bold mb-3">Add New Product</h2>
          {error && (
            <div className="rounded-md bg-red-50 p-3 mb-3 border border-red-200">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          )}
          <form id="add-product-form" onSubmit={handleSubmit}>
            <div className="flex gap-2 mb-3">
              <div className="w-1/2">
                <label className="block text-xs font-medium mb-1">Name*</label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleChange}
                  className="w-full p-1.5 text-sm border rounded"
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="block text-xs font-medium mb-1">Price*</label>
                <input
                  type="number"
                  name="price"
                  value={newProduct.price || ""}
                  onChange={handleChange}
                  className="w-full p-1.5 text-sm border rounded"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">
                Category*
              </label>
              <div className="relative">
                <select
                  name="category_id"
                  value={newProduct.category_id}
                  onChange={handleChange}
                  className="w-full p-1.5 text-sm border rounded appearance-none"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} {!category.uses_sizes}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              {selectedCategory && (
                <p className="text-xs text-gray-500 mt-1">
                  {isNoSizeCategory
                    ? "This category doesn't require size variants"
                    : "This category requires size variants"}
                </p>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={newProduct.description}
                onChange={handleChange}
                className="w-full p-1.5 text-sm border rounded"
              />
            </div>

            <div className="mb-3">
              {isNoSizeCategory ? (
                <div className="mb-3">
                  <label className="block text-xs font-medium mb-1">
                    Stock*
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={newProduct.stock || ""}
                    onChange={handleChange}
                    className="w-full p-1.5 text-sm border rounded"
                    required
                    min="0"
                    placeholder="Enter total stock"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This category uses direct stock instead of size variants
                  </p>
                </div>
              ) : (
                <>
                  {duplicateSizeWarning && (
                    <div className="text-yellow-600 text-xs mb-1">
                      {duplicateSizeWarning}
                    </div>
                  )}
                  <label className="block text-xs font-medium mb-1">
                    Size Variants*
                  </label>
                  <div className="flex gap-2 mb-2">
                    <div className="relative w-1/3">
                      <select
                        name="size"
                        value={currentVariant.size}
                        onChange={handleVariantChange}
                        className="w-full p-1.5 text-sm border rounded appearance-none"
                      >
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                    <div className="w-1/3">
                      <input
                        type="number"
                        name="stock"
                        placeholder="Stock"
                        value={currentVariant.stock}
                        onChange={handleVariantChange}
                        min="0"
                        className="w-full p-1.5 text-sm border rounded"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="w-1/3 bg-pink-500 hover:bg-pink-600 text-white text-sm px-2 py-1.5 rounded transition-colors"
                    >
                      Add Size
                    </button>
                  </div>
                  {newProduct.variants.length > 0 && (
                    <div className="border rounded p-2">
                      {newProduct.variants.map((variant, index) => (
                        <div
                          key={`${variant.size}-${index}`}
                          className="flex justify-between items-center py-1 px-2 even:bg-gray-50"
                        >
                          <span className="text-sm font-medium">
                            Size {variant.size}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewProduct((prev) => ({
                                  ...prev,
                                  variants: prev.variants.map((v, i) =>
                                    i === index
                                      ? {
                                          ...v,
                                          stock: Math.max(0, v.stock - 1),
                                        }
                                      : v
                                  ),
                                }));
                              }}
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="text-sm w-6 text-center">
                              {variant.stock}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewProduct((prev) => ({
                                  ...prev,
                                  variants: prev.variants.map((v, i) =>
                                    i === index
                                      ? { ...v, stock: v.stock + 1 }
                                      : v
                                  ),
                                }));
                              }}
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeVariant(index);
                              }}
                              className="text-red-500 hover:text-red-700 text-sm ml-2"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">
                Product Image*
              </label>

              {!imageFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? "border-pink-500 bg-pink-50 border-solid"
                      : "border-gray-300 hover:border-pink-400 hover:bg-gray-50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleBrowseClick}
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-pink-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Drop your image here or{" "}
                        <span className="text-pink-500 hover:text-pink-600">
                          browse
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports JPG, PNG, GIF • Max 5MB
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(imageFile)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {imageFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full w-full"></div>
                          </div>
                          <span className="text-xs text-green-600 font-medium">
                            Ready
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                      >
                        <svg
                          className="w-4 h-4"
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
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />

              {/* Image preview (larger version) */}
              {imageFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Image Preview
                  </p>
                  <div className="relative aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Product preview"
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
        {/* Fixed buttons at the bottom */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-product-form"
              className="bg-pink-500 hover:bg-pink-600 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding...
                </div>
              ) : (
                "Add Product"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
