import { useEffect, useState } from "react";
import api from "../services/api";
import EditCategoryForm from "./EditCategoryForm";
import AddCategoryForm from "./AddCategoryForm";

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        // Normalize categories to ensure consistent _id
        const normalizedCategories = response.data.map(category => ({
          ...category,
          _id: category._id || category.id,
          uses_sizes: category.uses_sizes !== undefined ? category.uses_sizes : true, // Default to true for backward compatibility
        }));
        setCategories(normalizedCategories);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleEdit = (category) => {
    setEditingCategory(category);
  };

  const handleUpdate = async (updatedCategory) => {
    try {
      console.log("Updating category with:", updatedCategory);

      const token = sessionStorage.getItem("authtoken");
      const response = await api.post(
        `/categories/${updatedCategory._id}`,
        { 
          name: updatedCategory.name,
          uses_sizes: updatedCategory.uses_sizes 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response:", response.data);

      // Update categories with a new array to ensure React detects the change
      setCategories((prevCategories) =>
        prevCategories.map((cat) =>
          cat._id === updatedCategory._id
            ? { ...cat, ...updatedCategory }
            : cat
        )
      );

      setEditingCategory(null);
      setSuccessMessage("Category updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error updating category:", error);
      setError("Failed to update category. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (id) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("authtoken");

      if (!id) {
        console.error("No ID provided for deletion!");
        return;
      }

      await api.delete(`/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCategories(categories.filter((category) => category._id !== id));
    } catch (error) {
      console.error("Error deleting category:", error);
      setError("Failed to delete category. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (newCategory) => {
    const token = sessionStorage.getItem("authtoken");
    try {
      setIsLoading(true);
      const response = await api.post("/categories", newCategory, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Normalize new category
      const newCategoryData = {
        ...response.data.category,
        _id: response.data.category._id || response.data.category.id,
        uses_sizes: response.data.category.uses_sizes !== undefined ? response.data.category.uses_sizes : true,
      };

      setCategories((prevCategories) => [...prevCategories, newCategoryData]);
      setShowAddForm(false);
      
      // Show success message
      setSuccessMessage("Category added successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error adding category:", error);
      setError("Failed to add category. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
              <p className="text-gray-600 mt-2">
                Manage your product categories
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-pink-400 to-pink-300 hover:from-pink-500 hover:to-pink-400 focus:outline-none transition-colors duration-200"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Category
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-5 w-5 flex items-center justify-center bg-green-100 rounded-full">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          )}

          {/* Categories Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="bg-white overflow-hidden shadow rounded-lg transition-all duration-200 hover:shadow-md"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {category.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.uses_sizes 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.uses_sizes ? 'Uses Sizes' : 'No Sizes'}
                      </span>
                    </div>
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => handleEdit(category)}
                        className="inline-flex items-center px-3 py-2 border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-pink-700 bg-pink-100 hover:bg-pink-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                      >
                        <svg
                          className="h-4 w-4 text-pink-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <svg
                          className="h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
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
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && categories.length === 0 && (
            <div className="text-center bg-white py-12 rounded-lg shadow">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No categories
              </h3>
              <p className="mt-1 text-gray-500">
                Get started by creating a new category.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  New Category
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <EditCategoryForm
          category={editingCategory}
          onUpdate={handleUpdate}
          onCancel={() => setEditingCategory(null)}
        />
      )}

      {/* Add Category Modal */}
      {showAddForm && (
        <AddCategoryForm
          key={Date.now()}
          onAdd={handleAddCategory}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}