import { useState, useEffect, useRef } from "react";
import api from "../services/api";

export default function EditProductForm({ product, onUpdate, onCancel }) {
  const [updatedProduct, setUpdatedProduct] = useState({
    ...product,
    id: product.id,
    category_name: product.category_name,
    variants: (product.variants || []).map((variant) => ({
      size: variant.size,
      stock: Number(variant.stock) || 0,
    })),
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
  });
  const [duplicateSizeWarning, setDuplicateSizeWarning] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [currentVariant, setCurrentVariant] = useState({
    size: "S",
    stock: "",
  });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [categoryChangeWarning, setCategoryChangeWarning] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);

  const selectedCategory = categories.find(
    (c) => c.name === updatedProduct.category_name
  );

  // Use the category's uses_sizes property
  const isNoSizeCategory = selectedCategory && !selectedCategory.uses_sizes;

  // Get the current image URL - either the existing product image or the new file preview
  const currentImageUrl = imageFile ? URL.createObjectURL(imageFile) : product.image;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        const normalizedCategories = response.data.map((category) => ({
          ...category,
          id: category.id || category._id,
          name: category.name || category.category_name,
          uses_sizes: category.uses_sizes !== undefined ? category.uses_sizes : true,
        }));
        setCategories(normalizedCategories);

        if (
          updatedProduct.category_name &&
          !normalizedCategories.find(
            (c) => c.id === updatedProduct.category_name
          )
        ) {
          const matchingCategory = normalizedCategories.find(
            (c) => c.name === updatedProduct.category_name
          );
          if (matchingCategory) {
            setUpdatedProduct((prev) => ({
              ...prev,
              category_id: matchingCategory.id,
            }));
          }
        }
      } catch (err) {
        setError("Failed to load categories.");
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, [updatedProduct.category_name]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (imageFile) {
        URL.revokeObjectURL(currentImageUrl);
      }
    };
  }, [imageFile]);

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
      if (file.type.startsWith('image/')) {
        setImageFile(file);
      } else {
        setError("Please select a valid image file");
      }
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "category_name") {
      const newCategory = value;
      const newSelectedCategory = categories.find(
        (c) => c.name === newCategory
      );
      const newIsNoSizeCategory =
        newSelectedCategory && !newSelectedCategory.uses_sizes;

      const currentIsNoSizeCategory =
        selectedCategory && !selectedCategory.uses_sizes;

      // Check if changing from size category to no-size category with existing variants
      if (
        !currentIsNoSizeCategory &&
        newIsNoSizeCategory &&
        updatedProduct.variants.length > 0
      ) {
        setCategoryChangeWarning(
          "Switching to a no-size category will remove all size variants. The product will use direct stock instead."
        );
        // Clear variants when switching to no-size category
        setUpdatedProduct((prev) => ({
          ...prev,
          [name]: value,
          variants: [],
          stock: 0, // Reset stock
        }));
      } else if (currentIsNoSizeCategory && !newIsNoSizeCategory) {
        // Switching from no-size to size-based category
        setCategoryChangeWarning(
          "Switching to a size-based category will remove all stock and it requires adding size variants."
        );
        setUpdatedProduct((prev) => ({
          ...prev,
          [name]: value,
          variants: [], // Clear variants to start fresh
          stock: 0, // Reset stock
        }));
      } else {
        setCategoryChangeWarning("");
        setUpdatedProduct((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else if (name === "stock" && isNoSizeCategory) {
      // Handle direct stock input for no-size categories
      setUpdatedProduct((prev) => ({
        ...prev,
        [name]: Number(value),
      }));
    } else {
      setUpdatedProduct((prev) => ({
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
    if (currentVariant.stock === "" || currentVariant.stock < 0) return;

    const existingVariantIndex = updatedProduct.variants.findIndex(
      (v) => v.size === currentVariant.size
    );
    if (existingVariantIndex >= 0) {
      // Show warning that we're updating existing size
      setDuplicateSizeWarning(
        `Size ${currentVariant.size} already exists - stock will be added`
      );

      setTimeout(() => setDuplicateSizeWarning(""), 5000); // Hide after 5 seconds

      setUpdatedProduct((prev) => ({
        ...prev,
        variants: prev.variants.map((v, i) =>
          i === existingVariantIndex
            ? { ...v, stock: v.stock + Number(currentVariant.stock) }
            : v
        ),
      }));
    } else {
      setDuplicateSizeWarning("");
      setUpdatedProduct((prev) => ({
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
    setUpdatedProduct((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        setError(null);
      } else {
        setError("Please select a valid image file (JPG, PNG, GIF)");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!updatedProduct.id) {
      setError("Product ID is missing!");
      return;
    }

    try {
      setFormSubmitting(true);
      setError(null);

      // Get the selected category
      const selectedCategory = categories.find(
        (c) => c.name === updatedProduct.category_name
      );

      // Check if switching to size-based category without variants
      if (
        selectedCategory &&
        selectedCategory.uses_sizes &&
        updatedProduct.variants.length === 0
      ) {
        setError("Please add at least one size variant for this product!");
        setFormSubmitting(false);
        return;
      }
      
      if (isNoSizeCategory && updatedProduct.stock < 0) {
        setError("Stock must be a positive number");
        setFormSubmitting(false);
        return;
      }
      
      const updateData = {
        _id: updatedProduct.id,
        name: updatedProduct.name,
        price: updatedProduct.price,
        category_name: updatedProduct.category_name,
        description: updatedProduct.description || "",
      };
      
      // Handle variants/stock based on category type
      if (!isNoSizeCategory) {
        // size-based category
        updateData.variants = updatedProduct.variants.map((v) => ({
          size: v.size,
          stock: Number(v.stock),
        }));
      } else {
        // No-sizes category
        updateData.stock = Number(updatedProduct.stock);
      }

      let formData = null;
      if (imageFile) {
        formData = new FormData();
        formData.append("image", imageFile);
        Object.entries(updateData).forEach(([key, value]) => {
          if (key === "variants") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        });
      }

      await onUpdate(formData || updateData);
    } catch (error) {
      console.error("Form submission error:", error);
      setError(error.message || "Failed to update product");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="modal fixed z-40 inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 overflow-y-auto py-6">
      <div className="relative bg-white rounded-xl shadow-lg w-[400px] max-h-[90vh] flex flex-col">
        <div className="overflow-y-auto p-4 flex-grow">
          <h2 className="text-xl font-bold mb-3">Edit Product</h2>
          {error && (
            <div className="rounded-md bg-red-50 p-2 mb-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          )}
          {/* Category Change Warning */}
          {categoryChangeWarning && (
            <div className="rounded-md bg-yellow-50 p-3 mb-3 border border-yellow-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Important Notice
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>{categoryChangeWarning}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <form id="edit-product-form" onSubmit={handleSubmit}>
            <div className="flex gap-2 mb-3">
              <div className="w-1/2">
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={updatedProduct.name || ""}
                  onChange={handleChange}
                  className="w-full p-1.5 text-sm border rounded"
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="block text-xs font-medium mb-1">Price</label>
                <input
                  type="number"
                  name="price"
                  value={updatedProduct.price || 0}
                  onChange={handleChange}
                  className="w-full p-1.5 text-sm border rounded"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Category</label>
              <div className="relative">
                <select
                  name="category_name"
                  value={updatedProduct.category_name || ""}
                  onChange={handleChange}
                  className="w-full p-1.5 text-sm border rounded appearance-none"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
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
                value={updatedProduct.description || ""}
                onChange={handleChange}
                className="w-full p-1.5 text-sm border rounded"
              />
            </div>

            {/* Stock/Variants Section - Conditionally Rendered */}
            {isNoSizeCategory ? (
              <div className="mb-3">
                <label className="block text-xs font-medium mb-1">Stock*</label>
                <input
                  type="number"
                  name="stock"
                  value={updatedProduct.stock || ""}
                  onChange={handleChange}
                  className="w-full p-1.5 text-sm border rounded"
                  required
                  min="0"
                  placeholder="Enter total stock"
                />
              </div>
            ) : (
              <div className="mb-3">
                <label className="block text-xs font-medium mb-1">
                  Size Variants*
                </label>
                {duplicateSizeWarning && (
                  <div className="text-yellow-500 text-xs mb-1">
                    {duplicateSizeWarning}
                  </div>
                )}
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
                {updatedProduct.variants.length > 0 && (
                  <div className="border rounded p-2">
                    {updatedProduct.variants.map((variant, index) => (
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
                              setUpdatedProduct((prev) => ({
                                ...prev,
                                variants: prev.variants.map((v, i) =>
                                  i === index
                                    ? { ...v, stock: Math.max(0, v.stock - 1) }
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
                              setUpdatedProduct((prev) => ({
                                ...prev,
                                variants: prev.variants.map((v, i) =>
                                  i === index ? { ...v, stock: v.stock + 1 } : v
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
              </div>
            )}

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">
                Product Image
              </label>

              {/* Show current image preview */}
              {currentImageUrl && (
                <div className="mb-3 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Current Image
                  </p>
                  <div className="relative aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <img
                      src={currentImageUrl}
                      alt="Current product"
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* File upload section */}
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
                        {currentImageUrl ? "Change image" : "Add product image"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
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
                          src={currentImageUrl}
                          alt="New preview"
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
              disabled={formSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-product-form"
              className="bg-pink-500 hover:bg-pink-600 text-white text-sm px-4 py-2 rounded transition-colors"
              disabled={formSubmitting}
            >
              {formSubmitting ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}