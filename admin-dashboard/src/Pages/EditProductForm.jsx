import { useState, useEffect } from "react";
import api from "../services/api";

export default function EditProductForm({ product, onUpdate, onCancel }) {
  const [updatedProduct, setUpdatedProduct] = useState({
    ...product,
    id: product.id || product._id,
    category_id: product.category_id || product.category,
    variants: (product.variants || []).map(variant => ({
      size: variant.size,
      stock: Number(variant.stock) || 0,
    })),
    price: Number(product.price) || 0,
  });
  const [duplicateSizeWarning, setDuplicateSizeWarning] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [currentVariant, setCurrentVariant] = useState({ size: 'S', stock: '' });
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        const normalizedCategories = response.data.map(category => ({
          ...category,
          id: category.id || category._id,
          name: category.name,
        }));
        setCategories(normalizedCategories);

        if (updatedProduct.category_id && !normalizedCategories.find(c => c.id === updatedProduct.category_id)) {
          const matchingCategory = normalizedCategories.find(c => c.name === updatedProduct.category_id);
          if (matchingCategory) {
            setUpdatedProduct(prev => ({ ...prev, category_id: matchingCategory.id }));
          }
        }
      } catch (err) {
        setError("Failed to load categories.");
        console.error("Error fetching categories:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [updatedProduct.category_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProduct((prev) => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value,
    }));
  };

  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    setCurrentVariant(prev => ({
      ...prev,
      [name]: name === 'stock' ? Number(value) : value,
    }));
  };

  const addVariant = () => {
    if (currentVariant.stock === '' || currentVariant.stock < 0) return;

    const existingVariantIndex = updatedProduct.variants.findIndex(
      v => v.size === currentVariant.size
    );
    if (existingVariantIndex >= 0) {
      // Show warning that we're updating existing size
      setDuplicateSizeWarning(`Size ${currentVariant.size} already exists - stock will be added`);

      setTimeout(() => setDuplicateSizeWarning(''), 5000); // Hide after 3 seconds

      setUpdatedProduct(prev => ({
        ...prev,
        variants: prev.variants.map((v, i) =>
          i === existingVariantIndex
            ? { ...v, stock: v.stock + Number(currentVariant.stock) }
            : v
        )
      }));
    } else {
      setDuplicateSizeWarning('');
      setUpdatedProduct(prev => ({
        ...prev,
        variants: [
          ...prev.variants,
          { size: currentVariant.size, stock: Number(currentVariant.stock) },
        ],
      }));
    }
    setCurrentVariant({ size: 'S', stock: '' });
  };

  const removeVariant = (index) => {
    setUpdatedProduct(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!updatedProduct.id) {
      setError("Product ID is missing!");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const updateData = {
        _id: updatedProduct.id,
        name: updatedProduct.name,
        price: updatedProduct.price,
        category: updatedProduct.category_id,
        description: updatedProduct.description || '',
        variants: updatedProduct.variants.map(v => ({
          size: v.size,
          stock: Number(v.stock)
        }))
      };

      let formData = null;
      if (imageFile) {
        formData = new FormData();
        formData.append('image', imageFile);
        Object.entries(updateData).forEach(([key, value]) => {
          if (key === 'variants') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        });
      }

      await onUpdate(formData || updateData);
    } catch (error) {
      console.error('Form submission error:', error);
      setError(error.message || 'Failed to update product');
    } finally {
      setIsLoading(false);
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
          <form id="edit-product-form" onSubmit={handleSubmit}>
            <div className="flex gap-2 mb-3">
              <div className="w-1/2">
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={updatedProduct.name || ''}
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
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Category</label>
              {isLoading ? (
                <div className="text-sm text-gray-500">Loading categories...</div>
              ) : (
                <div className="relative">
                  <select
                    name="category_id"
                    value={updatedProduct.category_id || ''}
                    onChange={handleChange}
                    className="w-full p-1.5 text-sm border rounded appearance-none"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={updatedProduct.description || ''}
                onChange={handleChange}
                className="w-full p-1.5 text-sm border rounded"
              />
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Size Variants*</label>
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
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
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
              {duplicateSizeWarning && (
                <div className="text-yellow-500 text-xs mb-1">{duplicateSizeWarning}</div>
              )}
              {updatedProduct.variants.map((variant, index) => (
                <div
                  key={`${variant.size}-${index}`}
                  className="flex justify-between items-center py-1 px-2 even:bg-gray-50"
                >
                  <span className="text-sm font-medium">Size {variant.size}</span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUpdatedProduct(prev => ({
                          ...prev,
                          variants: prev.variants.map((v, i) =>
                            i === index ? { ...v, stock: Math.max(0, v.stock - 1) } : v
                          )
                        }));
                      }}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      -
                    </button>

                    <span className="text-sm w-6 text-center">{variant.stock}</span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUpdatedProduct(prev => ({
                          ...prev,
                          variants: prev.variants.map((v, i) =>
                            i === index ? { ...v, stock: v.stock + 1 } : v
                          )
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

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Replace Image (Optional)</label>
              <input
                type="file"
                onChange={handleImageChange}
                className="w-full text-sm"
                accept="image/*"
              />
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : updatedProduct.image || ''}
                alt="Preview"
                className="w-full h-48 object-contain mt-2 rounded"
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
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-product-form"
              className="bg-pink-500 hover:bg-pink-600 text-white text-sm px-4 py-2 rounded transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}