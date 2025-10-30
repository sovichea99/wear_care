import { useState } from "react";

export default function AddCategoryForm({ onAdd, onCancel }) {
  const [newCategory, setNewCategory] = useState({
    name: '',
    uses_sizes: true, // Default to true for backward compatibility
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCategory((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      alert('Please enter a category name');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onAdd(newCategory);
      setNewCategory({ name: '', uses_sizes: true }); // Reset form after successful submit
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50">
      <div className="modal-content bg-white p-6 rounded-xl shadow-lg w-[400px]">
        <h2 className="text-xl font-bold mb-4">Add Category</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Category Name</label>
            <input
              type="text"
              name="name"
              value={newCategory.name}
              onChange={handleChange}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Enter category name"
              required
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="uses_sizes"
                checked={newCategory.uses_sizes}
                onChange={handleChange}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                This category uses size variants (S, M, L)
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2 ml-7">
              {newCategory.uses_sizes 
                ? "Products in this category will require size variants"
                : "Products in this category won't require size variants"
              }
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-sm px-4 py-2.5 rounded-lg transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-sm px-4 py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}